import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { DefaultSession } from "next-auth";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateName } from "@/utils/generateName";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.email && account) {
        try {
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          let dbUser = existingUser[0];

          if (!dbUser) {
            const inserted = await db
              .insert(users)
              .values({
                email: user.email,
                username: generateName(),
                hname: user.name || "",
                isEmailVerified: true,
                isMobileVerified: false,
              })
              .returning();
            dbUser = inserted[0];
          }

          token.userId = dbUser.uid.toString();
        } catch (error) {
          console.error("Error in JWT callback:", error);
          throw new Error("Database error during authentication");
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      return true;
    },

    async redirect({ url, baseUrl }) {
      // If it's a signout, redirect to home with logout message
      if (url.includes('/api/auth/signout')) {
        return "/?message=logged-out";
      }
      // For sign-in, redirect to /home
      if (url.includes('/api/auth/signin') || url === baseUrl) {
        return "/home";
      }
      // Default redirect to /home
      return "/home";
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log(`User signed in: ${user.email}`);
    },
  },
};

// Type augmentations for session and JWT
// (You may want to move these to a types file if used elsewhere)
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
} 