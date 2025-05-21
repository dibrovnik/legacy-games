import { User } from '@/types/user';
import { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

interface NextAuthToken {
  access_token: string;
  user: User;
}

declare module 'next-auth' {
  interface Session {
    user: User;
    access_token: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: User;
    access_token: string;
  }
}

export const authConfig: AuthOptions = {
  providers: [
    Credentials({
      credentials: {
        login: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      name: 'Credentials',
      // @ts-ignore
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          console.error('Missing login or password');
          return null;
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              login: credentials.login,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            console.error(`Failed to authenticate: ${res.statusText}`);
            return null;
          }

          const data = await res.json();
          if (data?.access_token && data?.user) {
            return {
              ...data.user,
              id: data.user.id,
              access_token: data.access_token,
            } as User & { access_token: string };
          }

          console.error('Invalid response from authentication API');
          return null;
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // @ts-ignore
    async jwt({ token, user, trigger, session: incomingSession }) {
      if (user) {
        if ('phone_verified_at' in user && 'email_verified_at' in user && 'role' in user) {
          token.user = {
            ...user,
            id: Number(user.id),
          } as User;
          // @ts-ignore
          token.access_token = user.access_token as string;
        }
      }
      if (trigger === 'update' && incomingSession?.user) {
        token.user = incomingSession.user as User;
      }
      return token as NextAuthToken;
    },

    async session({ session, token }) {
      if (token) {
        session.user = token.user as User;
        session.access_token = token.access_token as string;
      }
      console.log('session', session);
      return session;
    },
  },
};
