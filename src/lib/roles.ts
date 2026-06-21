// Single source of truth for role sets — imported by middleware and every API route.

export const SUPER_ROLES         = ["owner", "admin"] as const;
export const PRIVILEGED_ROLES    = ["manager", "owner", "admin"] as const;
export const EVENT_ROLES         = ["manager", "owner", "admin", "sales", "chef", "waiter", "cook"] as const;
export const EVENT_CREATOR_ROLES = ["manager", "owner", "admin", "sales"] as const;
export const REQUISITION_ROLES   = ["manager", "owner", "admin", "warehouse"] as const;
export const KITCHEN_ROLES       = ["manager", "owner", "admin", "chef"] as const;

export function isSuper(role: string): boolean {
  return (SUPER_ROLES as readonly string[]).includes(role);
}

export function isPrivileged(role: string): boolean {
  return (PRIVILEGED_ROLES as readonly string[]).includes(role);
}

export function canViewEvents(role: string): boolean {
  return (EVENT_ROLES as readonly string[]).includes(role);
}

export function canCreateEvents(role: string): boolean {
  return (EVENT_CREATOR_ROLES as readonly string[]).includes(role);
}

export function canViewRequisitions(role: string): boolean {
  return (REQUISITION_ROLES as readonly string[]).includes(role);
}

export function canManageKitchen(role: string): boolean {
  return (KITCHEN_ROLES as readonly string[]).includes(role);
}
