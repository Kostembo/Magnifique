// Shared Prisma select shapes — import these instead of re-declaring per route.

export const employeeListSelect = {
  id: true,
  full_name: true,
  phone: true,
  role: true,
  tier: true,
  created_at: true,
  photo_url: true,
} as const;
