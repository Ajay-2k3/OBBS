import { getCurrentUser } from '@/lib/permissions';
import BloodBankDashboard from '@/components/dashboard/blood-bank-dashboard';
import DashboardLayout from '@/components/layout/dashboard-layout';

export default async function BloodBankDashboardPage() {
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
      <BloodBankDashboard user={user} />
    </DashboardLayout>
  );
}
