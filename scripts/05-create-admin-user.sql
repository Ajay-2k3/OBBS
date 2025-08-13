-- Create initial admin user
-- This script should be run AFTER a user has signed up through the normal process
-- Replace the email below with the email of the user you want to make admin

-- First, let's create a function to safely create an admin user
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email TEXT,
    admin_full_name TEXT DEFAULT 'System Administrator',
    admin_phone TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_exists BOOLEAN;
    user_uuid UUID;
BEGIN
    -- Check if user already exists in auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = admin_email
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        -- If user doesn't exist, we need them to sign up first
        RETURN 'ERROR: User with email ' || admin_email || ' must sign up through the application first';
    END IF;
    
    -- Get the user's UUID
    SELECT id INTO user_uuid FROM auth.users WHERE email = admin_email;
    
    -- Check if user profile exists
    IF NOT EXISTS(SELECT 1 FROM public.users WHERE id = user_uuid) THEN
        -- Create user profile with admin role
        INSERT INTO public.users (
            id, 
            email, 
            full_name, 
            phone, 
            role,
            is_active
        ) VALUES (
            user_uuid,
            admin_email,
            admin_full_name,
            admin_phone,
            'admin',
            true
        );
        
        RETURN 'SUCCESS: Admin user created for ' || admin_email;
    ELSE
        -- Update existing user to admin role
        UPDATE public.users 
        SET role = 'admin', is_active = true, updated_at = NOW()
        WHERE id = user_uuid;
        
        RETURN 'SUCCESS: User ' || admin_email || ' updated to admin role';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Example usage (uncomment and modify the email):
-- SELECT create_admin_user('admin@bloodbank.com', 'System Administrator', '+1-555-0123');

-- Alternative: Direct update if you know the user already exists
-- UPDATE public.users 
-- SET role = 'admin', updated_at = NOW() 
-- WHERE email = 'your-email@example.com';

-- Create a default admin user with temporary credentials
-- You should change these credentials after first login
DO $$
DECLARE
    temp_admin_id UUID;
BEGIN
    -- Insert into auth.users (this simulates what Supabase auth would do)
    -- Note: In a real setup, you'd use Supabase's admin API or dashboard
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        uuid_generate_v4(),
        'admin@bloodbank.local',
        crypt('AdminPass123!', gen_salt('bf')), -- This is a placeholder - Supabase handles auth differently
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"System Administrator"}'
    ) 
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO temp_admin_id;
    
    -- If user was created, add to public.users
    IF temp_admin_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            email,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            temp_admin_id,
            'admin@bloodbank.local',
            'System Administrator',
            'admin',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Default admin user created: admin@bloodbank.local / AdminPass123!';
    END IF;
END $$;
