-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('donor', 'recipient', 'blood_bank', 'admin');
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'fulfilled', 'cancelled');
CREATE TYPE donation_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    blood_type blood_type,
    role user_role NOT NULL DEFAULT 'donor',
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_conditions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_donation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood banks table
CREATE TABLE public.blood_banks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    operating_hours TEXT,
    capacity INTEGER DEFAULT 1000,
    manager_id UUID REFERENCES public.users(id),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood inventory table
CREATE TABLE public.blood_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blood_bank_id UUID REFERENCES public.blood_banks(id) ON DELETE CASCADE,
    blood_type blood_type NOT NULL,
    units_available INTEGER NOT NULL DEFAULT 0,
    units_reserved INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    collection_date DATE NOT NULL,
    donor_id UUID REFERENCES public.users(id),
    batch_number TEXT,
    testing_status TEXT DEFAULT 'pending',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood requests table
CREATE TABLE public.blood_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    blood_type blood_type NOT NULL,
    units_needed INTEGER NOT NULL,
    urgency_level urgency_level NOT NULL,
    hospital_name TEXT NOT NULL,
    hospital_address TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_contact TEXT NOT NULL,
    medical_reason TEXT NOT NULL,
    needed_by_date DATE NOT NULL,
    status request_status DEFAULT 'pending',
    blood_bank_id UUID REFERENCES public.blood_banks(id),
    fulfilled_units INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table
CREATE TABLE public.donations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    blood_bank_id UUID REFERENCES public.blood_banks(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status donation_status DEFAULT 'scheduled',
    units_donated INTEGER,
    hemoglobin_level DECIMAL(3,1),
    blood_pressure TEXT,
    weight DECIMAL(5,2),
    temperature DECIMAL(4,2),
    pre_donation_notes TEXT,
    post_donation_notes TEXT,
    staff_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    related_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood compatibility table (for matching)
CREATE TABLE public.blood_compatibility (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_type blood_type NOT NULL,
    donor_type blood_type NOT NULL,
    is_compatible BOOLEAN NOT NULL,
    compatibility_score INTEGER DEFAULT 1
);

-- Audit log table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_blood_type ON public.users(blood_type);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_blood_inventory_type_bank ON public.blood_inventory(blood_type, blood_bank_id);
CREATE INDEX idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX idx_blood_requests_urgency ON public.blood_requests(urgency_level);
CREATE INDEX idx_donations_donor_date ON public.donations(donor_id, scheduled_date);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blood_banks_updated_at BEFORE UPDATE ON public.blood_banks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blood_inventory_updated_at BEFORE UPDATE ON public.blood_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE ON public.blood_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
