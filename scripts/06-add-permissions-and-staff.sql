-- Add permissions column to users table (skip if already exists)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.users ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;
  EXCEPTION 
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Create blood bank staff table (skip if already exists)
DO $$
BEGIN
  CREATE TABLE public.blood_bank_staff (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    blood_bank_id uuid NOT NULL REFERENCES public.blood_banks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role text CHECK (role IN ('staff', 'manager')) DEFAULT 'staff',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(blood_bank_id, user_id)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Add indexes for performance (skip if already exist)
DO $$
BEGIN
  BEGIN
    CREATE INDEX idx_blood_bank_staff_blood_bank_id ON public.blood_bank_staff(blood_bank_id);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX idx_blood_bank_staff_user_id ON public.blood_bank_staff(user_id);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
  
  BEGIN
    CREATE INDEX idx_users_permissions ON public.users USING gin(permissions);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
END $$;

-- Update existing users with default permissions based on role
UPDATE public.users SET permissions = 
  CASE 
    WHEN role = 'admin' THEN '{
      "can_manage_users": true,
      "can_manage_blood_banks": true,
      "can_view_audit_logs": true,
      "can_generate_reports": true,
      "can_approve_requests": true
    }'::jsonb
    WHEN role = 'blood_bank' THEN '{
      "can_manage_inventory": true,
      "can_manage_donations": true,
      "can_manage_requests": true,
      "can_manage_staff": true,
      "can_view_analytics": true
    }'::jsonb
    WHEN role = 'donor' THEN '{
      "can_schedule_donations": true,
      "can_view_donation_history": true,
      "can_update_profile": true
    }'::jsonb
    WHEN role = 'recipient' THEN '{
      "can_create_requests": true,
      "can_view_requests": true,
      "can_update_profile": true
    }'::jsonb
    ELSE '{}'::jsonb
  END
WHERE permissions = '{}'::jsonb OR permissions IS NULL;

-- Drop existing policies if they exist
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
  
  -- Drop existing policies for other tables
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

-- Enable RLS on all tables (will not error if already enabled)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.donation_history ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.blood_bank_staff ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for blood_banks table
CREATE POLICY "Anyone can view blood banks" ON public.blood_banks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blood banks" ON public.blood_banks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Blood bank admins can update their bank" ON public.blood_banks
  FOR UPDATE USING (admin_id = auth.uid());

-- RLS Policies for blood_inventory table
CREATE POLICY "Blood banks can manage their inventory" ON public.blood_inventory
  FOR ALL USING (
    blood_bank_id IN (
      SELECT id FROM public.blood_banks WHERE admin_id = auth.uid()
    ) OR
    blood_bank_id IN (
      SELECT blood_bank_id FROM public.blood_bank_staff WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for blood_requests table
CREATE POLICY "Users can view own requests" ON public.blood_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    blood_bank_id IN (
      SELECT id FROM public.blood_banks WHERE admin_id = auth.uid()
    ) OR
    blood_bank_id IN (
      SELECT blood_bank_id FROM public.blood_bank_staff WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Recipients can create requests" ON public.blood_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Blood banks and admins can update requests" ON public.blood_requests
  FOR UPDATE USING (
    blood_bank_id IN (
      SELECT id FROM public.blood_banks WHERE admin_id = auth.uid()
    ) OR
    blood_bank_id IN (
      SELECT blood_bank_id FROM public.blood_bank_staff WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for donation_history table
CREATE POLICY "Donors can view own donations" ON public.donation_history
  FOR SELECT USING (
    donor_id = auth.uid() OR
    blood_bank_id IN (
      SELECT id FROM public.blood_banks WHERE admin_id = auth.uid()
    ) OR
    blood_bank_id IN (
      SELECT blood_bank_id FROM public.blood_bank_staff WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Donors can create donations" ON public.donation_history
  FOR INSERT WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Blood banks can update donations" ON public.donation_history
  FOR UPDATE USING (
    blood_bank_id IN (
      SELECT id FROM public.blood_banks WHERE admin_id = auth.uid()
    ) OR
    blood_bank_id IN (
      SELECT blood_bank_id FROM public.blood_bank_staff WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for blood_bank_staff table
CREATE POLICY "Blood bank admins can manage staff" ON public.blood_bank_staff
  FOR ALL USING (
    blood_bank_id IN (
      SELECT id FROM public.blood_banks WHERE admin_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can view own association" ON public.blood_bank_staff
  FOR SELECT USING (user_id = auth.uid());
