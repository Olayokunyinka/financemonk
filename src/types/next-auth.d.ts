import type { UserRole } from "@/generated/prisma/enums";

// Augment Auth.js session/JWT to carry our app fields (user id + role).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: UserRole;
  }
}
