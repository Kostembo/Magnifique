// Centralized role helpers — used by middleware and every API route.

/** Roles with full admin-level access (same as manager + more). */
export const PRIVILEGED_ROLES = ["manager", "owner", "admin"] as const;

/** Roles allowed to create/edit events. */
export const EVENT_CREATOR_ROLES = ["manager", "owner", "admin", "sales"] as const;

/** Roles that manage the kitchen (chef tasks, cook assignments). */
export const KITCHEN_ROLES = ["manager", "owner", "admin", "chef"] as const;

export function isPrivileged(role: string): boolean {
  return (PRIVILEGED_ROLES as readonly string[]).includes(role);
}

export function canCreateEvents(role: string): boolean {
  return (EVENT_CREATOR_ROLES as readonly string[]).includes(role);
}

export function canManageKitchen(role: string): boolean {
  return (KITCHEN_ROLES as readonly string[]).includes(role);
}

export function canViewEvents(role: string): boolean {
  return ["manager", "owner", "admin", "sales", "chef", "waiter", "cook"].includes(role);
}
