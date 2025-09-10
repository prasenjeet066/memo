// lib/auth/auth.ts
import { AuthOptions } from 'next-auth';
import { NEXTAUTH_SECRET } from '@/lib/secret'
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/security/auth/db/provider';
import { User } from '@/lib/units/models/User';

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
        password: { label: 'Password', type: 'password' }
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
              { user_handler: credentials.usernameOrEmail.toLowerCase() }
            ]
          });
          
          if (!user) {
            throw new Error('Invalid credentials');
          }
          
          const isPasswordValid = await user.comparePassword(credentials.password);
          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }
          
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
            isEmailVerified: user.is_email_verified
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
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
            const username = user.email?.split('@')[0] || '';
            dbUser = new User({
              email: user.email,
              user_full_name: user.name || '',
              user_handler: username,
              password: Math.random().toString(36).slice(-8), // Random password for OAuth users
              user_dob: '1990-01-01', // Default DOB, should be updated by user
              is_email_verified: true,
              profile_image_url: user.image
            });
            await dbUser.save();
          }
          
          token.role = dbUser.user_role;
          token.username = dbUser.user_handler;
          token.isEmailVerified = dbUser.is_email_verified;
        } catch (error) {
          console.error('Error handling Google OAuth:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string[];
        session.user.username = token.username as string;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: NEXTAUTH_SECRET
}