import { UserWithPermissions } from '@/lib/permissions';
import ProfileMenu from './profile-menu';
import NotificationPanel from './notification-panel';

interface DashboardHeaderProps {
  user: UserWithPermissions;
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ user, title, subtitle }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <NotificationPanel userId={user.id} />
        <ProfileMenu user={user} />
      </div>
    </div>
  );
}
