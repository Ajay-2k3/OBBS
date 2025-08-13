-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Blood banks can view donors and recipients" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'blood_bank'
        ) AND role IN ('donor', 'recipient')
    );

-- Blood banks policies
CREATE POLICY "Anyone can view verified blood banks" ON public.blood_banks
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Blood bank managers can update their bank" ON public.blood_banks
    FOR UPDATE USING (manager_id = auth.uid());

CREATE POLICY "Admins can manage all blood banks" ON public.blood_banks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Blood inventory policies
CREATE POLICY "Blood banks can manage their inventory" ON public.blood_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.blood_banks bb
            JOIN public.users u ON bb.manager_id = u.id
            WHERE bb.id = blood_bank_id AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can view available inventory" ON public.blood_inventory
    FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can view all inventory" ON public.blood_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Blood requests policies
CREATE POLICY "Recipients can manage their requests" ON public.blood_requests
    FOR ALL USING (recipient_id = auth.uid());

CREATE POLICY "Blood banks can view and update requests" ON public.blood_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'blood_bank'
        )
    );

CREATE POLICY "Admins can manage all requests" ON public.blood_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Donations policies
CREATE POLICY "Donors can view their donations" ON public.donations
    FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Donors can create donations" ON public.donations
    FOR INSERT WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Blood banks can manage donations" ON public.donations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.blood_banks bb
            JOIN public.users u ON bb.manager_id = u.id
            WHERE bb.id = blood_bank_id AND u.id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all donations" ON public.donations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Blood compatibility is public read-only
ALTER TABLE public.blood_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blood compatibility" ON public.blood_compatibility
    FOR SELECT USING (true);
