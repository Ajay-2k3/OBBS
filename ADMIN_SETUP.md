# Admin User Setup Guide

## Default Admin Credentials

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

- **Email**: `admin@bloodbank.local`
- **Password**: `AdminPass123!`

## Creating Additional Admin Users

### Method 1: Using the Setup Function

1. Have the user sign up normally through the application
2. Run this SQL command in your Supabase SQL editor:

\`\`\`sql
SELECT create_admin_user('user@example.com', 'Admin Name', '+1-555-0123');
\`\`\`

### Method 2: Direct Database Update

If a user already exists and you want to make them an admin:

\`\`\`sql
UPDATE public.users 
SET role = 'admin', updated_at = NOW() 
WHERE email = 'user@example.com';
\`\`\`

### Method 3: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Find the user you want to make admin
4. Go to Database > Table Editor > users table
5. Find the user by email and change their `role` to `admin`

## Admin Capabilities

Admin users have access to:

- **User Management**: View and manage all users
- **Blood Bank Management**: Approve/manage all blood banks
- **Inventory Oversight**: View all blood inventory across banks
- **Request Management**: Oversee all blood requests
- **Donation Tracking**: Monitor all donations
- **System Analytics**: Access to audit logs and system reports
- **Real-time Monitoring**: Live updates on system activity

## Security Notes

1. **Change Default Password**: The default admin password should be changed immediately
2. **Limit Admin Users**: Only create admin accounts for trusted personnel
3. **Regular Audits**: Monitor admin activity through audit logs
4. **Strong Passwords**: Enforce strong password policies for admin accounts
5. **Two-Factor Auth**: Consider enabling 2FA for admin accounts (if supported)

## Troubleshooting

### Admin User Not Working

1. Verify the user exists in both `auth.users` and `public.users` tables
2. Check that the `role` field is set to `'admin'`
3. Ensure `is_active` is set to `true`
4. Clear browser cache and try logging in again

### Cannot Access Admin Features

1. Log out and log back in to refresh the session
2. Check browser console for any JavaScript errors
3. Verify RLS policies are properly set up (run script 03-setup-rls-policies.sql)

### Password Reset for Admin

If you forget the admin password:

1. Use Supabase dashboard to reset the password
2. Or update the user's password through the auth.users table
3. Or create a new admin user and disable the old one
