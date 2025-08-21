"use client";

import { UserWithPermissions } from '@/lib/permissions';
import { hasPermission } from '@/lib/role-router';
import { ReactNode } from 'react';

interface PermissionGateProps {
  user: UserWithPermissions;
  permission: keyof UserWithPermissions['permissions'];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({
  user,
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  if (!hasPermission(user.permissions, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
