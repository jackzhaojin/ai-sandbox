import type { NextAuthConfig } from 'next-auth';

// Extend the user type to include additional fields
interface ExtendedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/chat');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/chat', nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      // Add user ID to JWT token on sign in
      if (user) {
        token.id = user.id;
        token.avatarUrl = (user as ExtendedUser).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session from JWT
      if (session.user) {
        (session.user as ExtendedUser).id = token.id as string;
        (session.user as ExtendedUser).avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
  session: {
    strategy: 'jwt',
  },
} satisfies NextAuthConfig;
