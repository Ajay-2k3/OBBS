import { getCurrentUser } from '@/lib/permissions';
import RecipientDashboard from '@/components/dashboard/recipient-dashboard';
import DashboardLayout from '@/components/layout/dashboard-layout';

export default async function RecipientDashboardPage() {
  const user = await getCurrentUser();

  // Middleware already handles role validation and redirects
  // If we reach here, the user has proper access
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <RecipientDashboard user={user} />
    </DashboardLayout>
  );
}
