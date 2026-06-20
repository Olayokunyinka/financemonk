// Auth.js (NextAuth v5) configuration.
//
// Sign-in options:
//  - Google OAuth — enabled only when GOOGLE_CLIENT_ID/SECRET are set.
//  - Dev email login — passwordless, enabled when AUTH_DEV_LOGIN=true. Lets you
//    sign in locally with just an email so reviews/claims can be tested with no
//    external email service. MUST be off in production; the production path is a
//    real email magic-link (Resend) — see .env.example.
//
// Sessions are JWT (so the dev credentials provider works); the Prisma adapter
// still persists users and links OAuth accounts. Role lives on the token.

import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const providers: NextAuthConfig["providers"] = [];

export const googleEnabled = !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
export const resendEnabled = !!(
  process.env.RESEND_API_KEY && process.env.EMAIL_FROM
);
export const devLoginEnabled = process.env.AUTH_DEV_LOGIN === "true";

if (googleEnabled) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

// Production email magic-link. The verification token is stored via the Prisma
// adapter; works alongside JWT sessions.
if (resendEnabled) {
  providers.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    }),
  );
}

if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Email",
      credentials: { email: {}, name: {}, role: {} },
      // DEV ONLY: trusts the supplied email with no verification.
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!email || !email.includes("@")) return null;
        const name =
          String(creds?.name ?? "").trim() || email.split("@")[0];
        const role =
          String(creds?.role ?? "").toUpperCase() === "BUSINESS"
            ? UserRole.BUSINESS
            : UserRole.USER;
        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: { email, name, role },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role ?? UserRole.USER;
      }
      // Admins are granted by email allowlist (overrides stored role).
      if (
        token.email &&
        adminEmails.includes(String(token.email).toLowerCase())
      ) {
        token.role = UserRole.ADMIN;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.USER;
      }
      return session;
    },
  },
});
