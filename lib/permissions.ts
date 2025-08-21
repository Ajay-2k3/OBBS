import { createClient } from './supabase/server';
import { createServiceRoleClient } from './supabase/service';
import { UserRole, UserPermissions } from './role-router';

export interface UserWithPermissions {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  blood_type?: string;
  last_donation_date?: string | null;
  medical_conditions?: string[];
  role: UserRole;
  permissions: UserPermissions;
  is_eligible?: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_bank_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getCurrentUser(): Promise<UserWithPermissions | null> {
  const supabase = await createClient();
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    return null;
  }

  // Use service role client to bypass RLS for user lookup
  const serviceClient = createServiceRoleClient();

  const { data: user, error } = await serviceClient
    .from('users')
    .select(`
      id,
      email,
      full_name,
      phone,
      address,
      city,
      state,
      zip_code,
      blood_type,
      last_donation_date,
      medical_conditions,
      role,
      permissions,
      is_eligible,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at
    `)
    .eq('id', authUser.id)
    .single();

  if (error || !user) {
    return null;
  }

  // Get blood bank association if user is blood_bank role
  let blood_bank_id = null;
  if (user.role === 'blood_bank') {
    const { data: bloodBank } = await serviceClient
      .from('blood_banks')
      .select('id')
      .eq('admin_id', user.id)
      .single();
    
    if (bloodBank) {
      blood_bank_id = bloodBank.id;
    } else {
      // Check if user is staff at a blood bank
      const { data: staffRecord } = await serviceClient
        .from('blood_bank_staff')
        .select('blood_bank_id')
        .eq('user_id', user.id)
        .single();
      
      if (staffRecord) {
        blood_bank_id = staffRecord.blood_bank_id;
      }
    }
  }

  return {
    ...user,
    blood_bank_id,
    permissions: user.permissions || {},
  };
}

export async function updateUserPermissions(
  userId: string,
  permissions: Partial<UserPermissions>
): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('users')
    .update({ permissions })
    .eq('id', userId);

  return !error;
}

export async function addBloodBankStaff(
  bloodBankId: string,
  userEmail: string,
  role: 'staff' | 'manager' = 'staff'
): Promise<boolean> {
  const supabase = await createClient();
  
  // First, find the user by email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (userError || !user) {
    return false;
  }

  // Add staff record
  const { error } = await supabase
    .from('blood_bank_staff')
    .insert({
      blood_bank_id: bloodBankId,
      user_id: user.id,
      role,
    });

  return !error;
}

export async function removeBloodBankStaff(
  bloodBankId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('blood_bank_staff')
    .delete()
    .eq('blood_bank_id', bloodBankId)
    .eq('user_id', userId);

  return !error;
}

export async function getBloodBankStaff(bloodBankId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('blood_bank_staff')
    .select(`
      id,
      role,
      created_at,
      users:user_id (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq('blood_bank_id', bloodBankId);

  if (error) {
    return [];
  }

  return data || [];
}

export async function logAction(
  userId: string,
  action: string,
  tableName?: string,
  recordId?: string,
  oldValues?: any,
  newValues?: any
): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
    });
}
