export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  blood_type?: string;
  last_donation_date?: string;
  medical_conditions?: string[];
  role: string;
  is_eligible?: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_bank_id?: string; // <-- Added for blood bank association
  created_at?: string;
  updated_at?: string;
}
