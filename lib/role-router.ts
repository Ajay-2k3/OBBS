// Role-based routing utility
export type UserRole = 'admin' | 'blood_bank' | 'donor' | 'recipient';

export interface UserPermissions {
  can_manage_users?: boolean;
  can_manage_blood_banks?: boolean;
  can_view_audit_logs?: boolean;
  can_generate_reports?: boolean;
  can_approve_requests?: boolean;
  can_manage_inventory?: boolean;
  can_manage_donations?: boolean;
  can_manage_requests?: boolean;
  can_manage_staff?: boolean;
  can_view_analytics?: boolean;
  can_schedule_donations?: boolean;
  can_view_donation_history?: boolean;
  can_create_requests?: boolean;
  can_view_requests?: boolean;
  can_update_profile?: boolean;
}

export function routeByRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'blood_bank':
      return '/dashboard/blood-bank';
    case 'donor':
      return '/dashboard/donor';
    case 'recipient':
      return '/dashboard/recipient';
    default:
      return '/auth/login';
  }
}

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  // Admin-specific routes
  const adminRoutes = ['/admin/', '/dashboard/admin'];
  if (adminRoutes.some(route => pathname.startsWith(route)) && userRole !== 'admin') {
    return false;
  }

  // Blood Bank-specific routes
  const bloodBankRoutes = ['/blood-bank/', '/dashboard/blood-bank'];
  if (bloodBankRoutes.some(route => pathname.startsWith(route)) && userRole !== 'blood_bank' && userRole !== 'admin') {
    return false;
  }

  // Donor-specific routes
  const donorRoutes = ['/donations/schedule', '/donations/history', '/dashboard/donor'];
  if (donorRoutes.some(route => pathname.startsWith(route)) && userRole !== 'donor' && userRole !== 'admin') {
    return false;
  }

  // Recipient-specific routes
  const recipientRoutes = ['/blood-requests/new', '/blood-requests/history', '/dashboard/recipient'];
  if (recipientRoutes.some(route => pathname.startsWith(route)) && userRole !== 'recipient' && userRole !== 'admin') {
    return false;
  }

  // Allow access to general pages for all authenticated users
  const generalPages = [
    '/profile', 
    '/settings', 
    '/notifications',
    '/community',
    '/dashboard' // General dashboard redirect
  ];
  if (generalPages.some(page => pathname.startsWith(page))) {
    return true;
  }
  
  // Admins can access everything
  if (userRole === 'admin') {
    return true;
  }
  
  return true; // Allow other routes by default
}

export function getDefaultPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        can_manage_users: true,
        can_manage_blood_banks: true,
        can_view_audit_logs: true,
        can_generate_reports: true,
        can_approve_requests: true,
      };
    case 'blood_bank':
      return {
        can_manage_inventory: true,
        can_manage_donations: true,
        can_manage_requests: true,
        can_manage_staff: true,
        can_view_analytics: true,
        can_update_profile: true,
      };
    case 'donor':
      return {
        can_schedule_donations: true,
        can_view_donation_history: true,
        can_update_profile: true,
      };
    case 'recipient':
      return {
        can_create_requests: true,
        can_view_requests: true,
        can_update_profile: true,
      };
    default:
      return {};
  }
}

export function hasPermission(
  userPermissions: UserPermissions | null,
  requiredPermission: keyof UserPermissions
): boolean {
  return userPermissions?.[requiredPermission] === true;
}
