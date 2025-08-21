-- Fix RLS policies to prevent infinite recursion
-- This script fixes the recursive RLS policies that were causing database errors

-- First, disable RLS temporarily to avoid recursion during updates
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing problematic policies
DO $$ 
BEGIN
  -- Drop existing policies for users table
  DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
  
  -- Drop existing policies for blood_banks table
  DROP POLICY IF EXISTS "Anyone can view blood banks" ON public.blood_banks;
  DROP POLICY IF EXISTS "Admins can manage blood banks" ON public.blood_banks;
  DROP POLICY IF EXISTS "Blood bank admins can update their bank" ON public.blood_banks;
  
  -- Drop existing policies for other tables that reference users
  DROP POLICY IF EXISTS "Blood banks can manage their inventory" ON public.blood_inventory;
  DROP POLICY IF EXISTS "Users can view own requests" ON public.blood_requests;
  DROP POLICY IF EXISTS "Recipients can create requests" ON public.blood_requests;
  DROP POLICY IF EXISTS "Blood banks and admins can update requests" ON public.blood_requests;
  DROP POLICY IF EXISTS "Donors can view own donations" ON public.donation_history;
  DROP POLICY IF EXISTS "Donors can create donations" ON public.donation_history;
  DROP POLICY IF EXISTS "Blood banks can update donations" ON public.donation_history;
  DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
  DROP POLICY IF EXISTS "Blood bank admins can manage staff" ON public.blood_bank_staff;
  DROP POLICY IF EXISTS "Staff can view own association" ON public.blood_bank_staff;
END $$;

-- Create a function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Direct query to avoid RLS recursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check blood bank admin role
CREATE OR REPLACE FUNCTION public.is_blood_bank_admin(bank_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.blood_banks 
    WHERE id = bank_id 
    AND admin_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check blood bank staff
CREATE OR REPLACE FUNCTION public.is_blood_bank_staff(bank_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.blood_bank_staff 
    WHERE blood_bank_id = bank_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create non-recursive RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- For admin operations, we'll use a separate policy that bypasses RLS
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for blood_banks table
CREATE POLICY "Anyone can view blood banks" ON public.blood_banks
  FOR SELECT USING (true);

CREATE POLICY "Blood bank admins can update their bank" ON public.blood_banks
  FOR UPDATE USING (admin_id = auth.uid());

CREATE POLICY "Service role can manage blood banks" ON public.blood_banks
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for blood_inventory table
CREATE POLICY "Users can view blood inventory" ON public.blood_inventory
  FOR SELECT USING (true);

CREATE POLICY "Blood bank staff can manage inventory" ON public.blood_inventory
  FOR ALL USING (
    is_blood_bank_admin(blood_bank_id) OR 
    is_blood_bank_staff(blood_bank_id)
  );

CREATE POLICY "Service role can manage inventory" ON public.blood_inventory
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for blood_requests table
CREATE POLICY "Users can view own requests" ON public.blood_requests
  FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Recipients can create requests" ON public.blood_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Blood bank staff can view requests" ON public.blood_requests
  FOR SELECT USING (
    is_blood_bank_admin(blood_bank_id) OR 
    is_blood_bank_staff(blood_bank_id)
  );

CREATE POLICY "Blood bank staff can update requests" ON public.blood_requests
  FOR UPDATE USING (
    is_blood_bank_admin(blood_bank_id) OR 
    is_blood_bank_staff(blood_bank_id)
  );

CREATE POLICY "Service role can manage requests" ON public.blood_requests
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for donation_history table
CREATE POLICY "Donors can view own donations" ON public.donation_history
  FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Donors can create donations" ON public.donation_history
  FOR INSERT WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Blood bank staff can manage donations" ON public.donation_history
  FOR ALL USING (
    is_blood_bank_admin(blood_bank_id) OR 
    is_blood_bank_staff(blood_bank_id)
  );

CREATE POLICY "Service role can manage donations" ON public.donation_history
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for audit_logs table
CREATE POLICY "Service role can manage audit logs" ON public.audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for blood_bank_staff table
CREATE POLICY "Staff can view own association" ON public.blood_bank_staff
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Blood bank admins can manage their staff" ON public.blood_bank_staff
  FOR ALL USING (is_blood_bank_admin(blood_bank_id));

CREATE POLICY "Service role can manage staff" ON public.blood_bank_staff
  FOR ALL USING (auth.role() = 'service_role');

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blood_bank_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blood_bank_staff(uuid) TO authenticated;

-- Update admin permissions using service role access
-- This needs to be done by the admin or service role
COMMENT ON SCHEMA public IS 'Fixed RLS policies to prevent infinite recursion';
