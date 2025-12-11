import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { UserService } from './database';
import { logger } from './logger';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          logger.warn('Sign-in attempt without email');
          return false;
        }

        // Check if user is registered and active
        const isRegistered = await UserService.isUserRegistered(user.email);
        
        if (!isRegistered) {
          logger.warn('Unregistered user attempted sign-in:', { 
            email: user.email,
            name: user.name 
          });
          return '/auth/unauthorized';
        }

        // Update user info in database
        await UserService.upsertUser({
          id: user.id || profile?.sub || '',
          email: user.email,
          name: user.name || '',
          image: user.image,
        });

        logger.info('Successful sign-in for registered user:', { 
          email: user.email 
        });
        
        return true;
      } catch (error) {
        logger.error('Error during sign-in callback:', { 
          email: user.email, 
          error 
        });
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        
        // Double-check user is still registered and active
        if (session.user.email) {
          const isRegistered = await UserService.isUserRegistered(session.user.email);
          if (!isRegistered) {
            logger.warn('Session found for unregistered user:', { 
              email: session.user.email 
            });
            return null;
          }
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  events: {
    async signOut({ session }) {
      if (session?.user?.email) {
        logger.info('User signed out:', { email: session.user.email });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
