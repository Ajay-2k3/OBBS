import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/permissions';
import { canAccessRoute } from '@/lib/role-router';

export default async function RoleMiddleware({ 
  children, 
  requiredRole,
  pathname 
}: {
  children: React.ReactNode;
  requiredRole?: string;
  pathname?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (requiredRole && user.role !== requiredRole) {
    redirect('/');
  }

  if (pathname && !canAccessRoute(user.role, pathname)) {
    redirect('/');
  }

  return <>{children}</>;
}
