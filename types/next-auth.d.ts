// types/next-auth.d.ts
import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    // Set when this device's token was invalidated (password changed); the navbar then signs out.
    invalid?: boolean;
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: Role;
    tokenVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    tokenVersion?: number;
    invalid?: boolean;
  }
}