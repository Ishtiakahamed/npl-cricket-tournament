import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NEXTAUTH_DEBUG === "1",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name ?? user.username,
          email: `${user.username}@npl.local`,
          username: user.username,
          role: user.role,
        } as unknown as { id: string; name: string; email: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error custom fields
        token.role = user.role;
        // @ts-expect-error custom fields
        token.username = user.username;
        token.sub = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error custom fields
        session.user.id = token.sub;
        // @ts-expect-error custom fields
        session.user.role = token.role;
        // @ts-expect-error custom fields
        session.user.username = token.username;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const auth = () => getServerSession(authOptions);

export async function requireRole(role: "ADMIN" | "SCORER") {
  const session = await auth();
  if (!session?.user || session.user.role !== role) return null;
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}
export async function requireScorer() {
  return requireRole("SCORER");
}
