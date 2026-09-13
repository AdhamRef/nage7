import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies, headers } from "next/headers";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/lib/db";
import {
  DEVICE_COOKIE,
  DEVICE_LOCKED_ERROR,
  deviceLabelFrom,
  isDeviceId,
} from "@/lib/device";
import { isTeacher } from "@/lib/teacher";

/**
 * The browser's device id, from the cookie the client mirrors localStorage
 * into. Returns null outside a request scope.
 */
const readDeviceId = () => {
  try {
    const value = cookies().get(DEVICE_COOKIE)?.value;
    return isDeviceId(value) ? value : null;
  } catch {
    return null;
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  // Credentials logins can't use database sessions, so the whole app is on JWT.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Someone who registered with a password can still sign in with Google
      // on the same address instead of hitting OAuthAccountNotLinked.
      allowDangerousEmailAccountLinking: true,
      // The 3500ms default is not enough for the token exchange here.
      httpOptions: { timeout: 15000 },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
        deviceId: { label: "device", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        // No account, or an account that only ever signed in with Google.
        if (!user?.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // One account, one device. The form posts the id; the cookie is the
        // fallback for a client that could not attach it.
        if (!isTeacher({ id: user.id, email: user.email })) {
          const deviceId = isDeviceId(credentials.deviceId)
            ? credentials.deviceId
            : readDeviceId();

          if (deviceId) {
            if (!user.deviceId) {
              await db.user.update({
                where: { id: user.id },
                data: {
                  deviceId,
                  deviceLabel: deviceLabelFrom(headers().get("user-agent")),
                  deviceBoundAt: new Date(),
                },
              });
            } else if (user.deviceId !== deviceId) {
              throw new Error(DEVICE_LOCKED_ERROR);
            }
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * One account, one device. The first sign-in pins the account to the
     * browser's id; a different browser is refused outright, even after a
     * logout, until a teacher clears the binding.
     */
    async signIn({ user }) {
      if (!user?.email) return false;
      // Teachers are exempt — they need to work from anywhere.
      if (isTeacher({ id: user.id, email: user.email })) return true;

      const deviceId = readDeviceId();
      // No id at all means a client that cannot store one; let it through
      // rather than locking a legitimate student out of the platform.
      if (!deviceId) return true;

      const record = await db.user.findUnique({
        where: { email: user.email },
        select: { id: true, deviceId: true },
      });
      if (!record) return true;

      if (!record.deviceId) {
        await db.user.update({
          where: { id: record.id },
          data: {
            deviceId,
            deviceLabel: deviceLabelFrom(headers().get("user-agent")),
            deviceBoundAt: new Date(),
          },
        });
        return true;
      }

      if (record.deviceId === deviceId) return true;

      // NextAuth turns this into ?error=DeviceLocked on the sign-in page.
      return `/sign-in?error=${DEVICE_LOCKED_ERROR}`;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isTeacher = isTeacher({ id: user.id, email: user.email });
        return token;
      }

      // Keep the token in sync with profile edits on later requests.
      if (token.email) {
        const existing = await db.user.findUnique({
          where: { email: token.email },
          select: { id: true, name: true, image: true, deviceId: true },
        });
        if (existing) {
          token.id = existing.id;
          token.name = existing.name;
          token.picture = existing.image;
          token.deviceId = existing.deviceId;
          token.isTeacher = isTeacher({
            id: existing.id,
            email: token.email,
          });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export interface AuthResult {
  userId: string | null;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

/**
 * Server-side session helper. Deliberately shaped like the `auth()` this app
 * used before, so every route and page keeps reading `const { userId } = ...`.
 */
export const auth = async (): Promise<AuthResult> => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  return {
    userId,
    user: userId ? { ...session!.user, id: userId } : null,
  };
};
