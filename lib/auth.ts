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
          where: { Email: credentials.email.trim().toLowerCase() },
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
          tokenVersion: user.TokenVersion,
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
        token.tokenVersion = user.tokenVersion;
        token.invalid = false;
      } else if (token.id && !token.invalid) {
        // JWTs can't be revoked, so on every use compare the token's version with the
        // account's current one. Changing/resetting a password bumps it, which makes
        // every token issued before that moment stop working on all devices.
        // Tokens minted before this check existed have no version and count as 0.
        //
        // If the database can't be reached this one time, keep the token as it is. Throwing
        // from this callback makes NextAuth treat the session as broken and clear the cookie,
        // which logs the user out on a hiccup that has nothing to do with their account.
        try {
          const current = await prisma.user.findUnique({
            where: { UserID: token.id },
            select: { TokenVersion: true, FullName: true },
          });
          if (!current || current.TokenVersion !== (token.tokenVersion ?? 0)) {
            token.invalid = true;
          } else {
            // Keep the displayed name current (users can correct it in Account settings).
            token.name = current.FullName;
          }
        } catch (err) {
          console.error("Session check failed (keeping the existing token):", err);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.invalid) {
        // Hand back a session with no user: every page and API route already treats
        // that as "not logged in". `invalid` lets the navbar clear the stale cookie.
        return { expires: session.expires, invalid: true } as unknown as typeof session;
      }
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};