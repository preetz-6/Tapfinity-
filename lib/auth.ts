import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 day
  },

  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },

  providers: [
    /* ===================== ADMIN LOGIN ===================== */
    CredentialsProvider({
      id: "admin-credentials",
      name: "AdminCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });

        if (!admin || admin.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(
          credentials.password,
          admin.passwordHash
        );

        if (!valid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "ADMIN",
        };
      },
    }),

    /* ===================== MERCHANT LOGIN ===================== */
    CredentialsProvider({
      id: "merchant-credentials",
      name: "MerchantCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const merchant = await prisma.merchant.findUnique({
          where: { email: credentials.email },
        });

        if (!merchant || merchant.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(
          credentials.password,
          merchant.passwordHash
        );

        if (!valid) return null;

        return {
          id: merchant.id,
          email: merchant.email,
          name: merchant.name,
          role: "MERCHANT",
        };
      },
    }),

    /* ===================== USER LOGIN ===================== */
    CredentialsProvider({
      id: "user-credentials",
      name: "UserCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: "USER",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
