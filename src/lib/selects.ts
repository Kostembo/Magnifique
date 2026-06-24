// Shared Prisma select shapes — import these instead of re-declaring per route.

export const employeeListSelect = {
  id: true,
  full_name: true,
  phone: true,
  role: true,
  tier: true,
  created_at: true,
  photo_url: true,
  hourly_rate: true,
  min_pay_amount: true,
  min_pay_hours: true,
} as const;
