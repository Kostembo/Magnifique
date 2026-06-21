import "next-auth";
import "next-auth/jwt";
import type { Role, Tier } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      tier: Tier;
      phone: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    tier?: Tier;
    phone?: string;
  }
}
