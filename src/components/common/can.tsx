"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";

export function hasPermission(
  permission: string,
  permissions?: string[],
  isPlatformAdmin?: boolean,
) {
  if (isPlatformAdmin) return true;
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  if (
    !user ||
    !hasPermission(permission, user.permissions, user.is_platform_admin)
  )
    return <>{fallback}</>;
  return <>{children}</>;
}
