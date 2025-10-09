// lib/auth/auth.ts (Updated with DAL)

import { AuthOptions } from 'next-auth';
import { NEXTAUTH_SECRET } from '@/lib/secret';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserDAL } from '@/lib/dal/user.dal';
import { UserMapper } from '@/lib/mappers/user.mapper';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        usernameOrEmail: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.usernameOrEmail || !credentials?.password) {
          throw new Error('Please provide both username/email and password');
        }

        try {
          // Use DAL to find user
          const user = await UserDAL.findByEmailOrUsername(
            credentials.usernameOrEmail
          );

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // Check if account is locked
          if (user.isAccountLocked()) {
            throw new Error(
              'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
            );
          }

          // Verify password
          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          if (!isPasswordValid) {
            await user.incrementFailedLogins();
            throw new Error('Invalid credentials');
          }

          // Reset failed login attempts on successful login
          await user.resetFailedLogins();

          // Update last login using DAL
          await UserDAL.updateLastLogin(user._id.toString());

          // Convert to session DTO
          return UserMapper.toSessionDTO(user);
        } catch (error) {
          console.error('Auth error:', error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Authentication failed');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.isEmailVerified = user.isEmailVerified;
      }

      // Handle Google OAuth
      if (account?.provider === 'google' && user) {
        try {
          let dbUser = await UserDAL.findByEmail(user.email!);

          if (!dbUser) {
            // Generate unique username from email
            const baseUsername = user.email?.split('@')[0]?.toLowerCase() || '';
            const finalUsername = await UserDAL.generateUniqueUsername(
              baseUsername
            );

            // Create OAuth user using DAL
            dbUser = await UserDAL.createOAuthUser({
              email: user.email!,
              fullName: user.name || '',
              username: finalUsername,
              profileImageUrl: user.image,
              oauthProvider: 'google',
            });
          } else {
            // Update last login for existing OAuth user
            await UserDAL.updateLastLogin(dbUser._id.toString());
          }

          token.role = dbUser.user_role;
          token.username = dbUser.user_handler;
          token.isEmailVerified = dbUser.is_email_verified;
        } catch (error) {
          console.error('Error handling Google OAuth:', error);
          // Provide fallback values to prevent authentication failure
          token.role = token.role || ['REG'];
          token.username = token.username || user.email?.split('@')[0] || 'user';
          token.isEmailVerified = token.isEmailVerified ?? false;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as string[]) || ['REG'];
        session.user.username = (token.username as string) || '';
        session.user.isEmailVerified = (token.isEmailVerified as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: NEXTAUTH_SECRET,
};