import { AuthOptions } from 'next-auth';
import { NEXTAUTH_SECRET } from '@/lib/secret'
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/security/auth/db/provider';
import { User } from '@/lib/units/models/User';
import crypto from 'crypto';

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
          await connectDB();

          // Find user by email or username
          const user = await User.findOne({
            $or: [
              { email: credentials.usernameOrEmail.toLowerCase() },
              { user_handler: credentials.usernameOrEmail.toLowerCase() },
            ],
          });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // Check if account is locked
          if (user.isAccountLocked()) {
            throw new Error('Account is temporarily locked due to multiple failed login attempts. Please try again later.');
          }

          // Verify password
          const isPasswordValid = await user.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            await user.incrementFailedLogins();
            throw new Error('Invalid credentials');
          }

          // Reset failed login attempts on successful login
          await user.resetFailedLogins();

          // Update last login
          user.last_login = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.user_full_name,
            image: user.profile_image_url || null,
            role: user.user_role,
            username: user.user_handler,
            isEmailVerified: user.is_email_verified,
          };
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
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.isEmailVerified = user.isEmailVerified;
      }

      // Handle Google OAuth
      if (account?.provider === 'google' && user) {
        try {
          await connectDB();
          let dbUser = await User.findOne({ email: user.email });

          if (!dbUser) {
            // Create new user from Google profile
            const username = user.email?.split('@')[0]?.toLowerCase() || '';
            
            // Ensure unique username
            let finalUsername = username;
            let counter = 1;
            while (await User.findOne({ user_handler: finalUsername })) {
              finalUsername = `${username}${counter}`;
              counter++;
            }

            // Generate secure random password for OAuth users
            const securePassword = crypto.randomBytes(32).toString('hex');

            dbUser = new User({
              email: user.email?.toLowerCase(),
              user_full_name: user.name || '',
              user_handler: finalUsername,
              password: securePassword,
              is_email_verified: true,
              profile_image_url: user.image,
              oauth_provider: 'google',
              user_role: ['REG'],
            });
            await dbUser.save();
          } else {
            // Update last login for existing OAuth user
            dbUser.last_login = new Date();
            await dbUser.save();
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
      name: process.env.NODE_ENV === 'production' 
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
