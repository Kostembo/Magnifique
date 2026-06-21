import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Телефон" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ phone: z.string().min(1), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { phone, password } = parsed.data;

        const normalizedPhone = phone.replace(/\D/g, "");

        const employee = await prisma.employee.findFirst({
          where: {
            OR: [
              { phone: normalizedPhone },
              { phone: "7" + normalizedPhone.slice(-10) },
              { phone: normalizedPhone.slice(-10) },
            ],
          },
        });

        if (!employee) return null;

        const isValid = await bcrypt.compare(password, employee.password_hash);
        if (!isValid) return null;

        return {
          id: employee.id,
          name: employee.full_name,
          email: employee.phone,
          role: employee.role,
          tier: employee.tier,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.tier = (user as { tier: string }).tier;
        token.phone = user.email ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as string;
        session.user.tier = token.tier as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});
