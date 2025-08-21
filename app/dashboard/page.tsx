import { getCurrentUser } from '@/lib/permissions';
import DashboardLayout from '@/components/layout/dashboard-layout';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Loading Dashboard...</h1>
          <p className="text-gray-600 mt-2">You should be redirected to your role-specific dashboard shortly.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
