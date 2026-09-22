// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Google is only added if credentials exist in .env.local.
//  Google Cloud will be setup later
// and the "Sign in with Google" button simply won't be wired up until you add the keys.
//
// PrismaAdapter expects
// default NextAuth field names on User (email, name, image, emailVerified),
// but our User model uses Email, FullName, image, and no emailVerified rename
// needed — Email/FullName WILL break the adapter's internal calls. Come back
// to this before enabling Google.
const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    ...providers,

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

  
        const user = await prisma.user.findUnique({
          where: { Email: credentials.email },
        });

        
        if (!user || !user.Password) {
          throw new Error("No account found with that email.");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.Password
        );

        if (!passwordMatch) {
          throw new Error("Incorrect password.");
        }

       
        return {
          id: user.UserID,
          email: user.Email,
          name: user.FullName,
          image: user.image,
          role: user.Role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // `user` here is the object authorize() returned above (NextAuth's
      // shape)
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};