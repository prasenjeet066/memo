// lib/auth/auth.ts
import { AuthOptions } from 'next-auth';
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
  secret: process.env.NEXTAUTH_SECRET,
};

// ===== API ROUTE: app/api/auth/[...nextauth]/route.ts =====



// ===== UPDATED LOGIN PAGE: app/login/page.tsx =====
}

// ===== REGISTRATION PAGE: app/register/page.tsx =====
"use client"
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [passwordType, setPasswordType] = useState(true)
  const [confirmPasswordType, setConfirmPasswordType] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    dob: ''
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    const { email, password, confirmPassword, username, fullName, dob } = formData
    
    // Validation
    if (!email || !password || !confirmPassword || !username || !fullName || !dob) {
      setError('Please fill in all fields.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setIsLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName,
          dob
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 flex items-center justify-between border-b shadow-sm">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={() => router.back()} />
          <h1 className="font-semibold text-gray-900">Sign Up</h1>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Create Account
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Username */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="dob" className="text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <input
                    id="password"
                    name="password"
                    type={passwordType ? 'password' : 'text'}
                    value={formData.password}
                    onChange={handleChange}
                    className="flex-1 focus:outline-none"
                    required
                    disabled={isLoading}
                  />
                  {passwordType ? (
                    <Eye
                      className="w-4 h-4 text-gray-500 cursor-pointer"
                      onClick={() => setPasswordType(false)}
                    />
                  ) : (
                    <EyeOff
                      className="w-4 h-4 text-gray-500 cursor-pointer"
                      onClick={() => setPasswordType(true)}
                    />
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={confirmPasswordType ? 'password' : 'text'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="flex-1 focus:outline-none"
                    required
                    disabled={isLoading}
                  />
                  {confirmPasswordType ? (
                    <Eye
                      className="w-4 h-4 text-gray-500 cursor-pointer"
                      onClick={() => setConfirmPasswordType(false)}
                    />
                  ) : (
                    <EyeOff
                      className="w-4 h-4 text-gray-500 cursor-pointer"
                      onClick={() => setConfirmPasswordType(true)}
                    />
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// ===== UPDATED RATE LIMITER: lib/security/auth/rate-limiter.ts =====
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiterSystem {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: { [key: string]: number } = {
    login: 5,
    register: 3,
    default: 10
  };
  private readonly windowMs: number = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  checkRequest(identifier: string, type: string = 'default'): boolean {
    const key = `${identifier}-${type}`;
    const now = Date.now();
    const entry = this.attempts.get(key);
    
    // If no entry or window expired, allow request
    if (!entry || now > entry.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    // Check if limit exceeded
    const maxAttempts = this.maxAttempts[type] || this.maxAttempts.default;
    if (entry.count >= maxAttempts) {
      return false;
    }
    
    // Increment counter
    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts) {
      if (now > entry.resetTime) {
        this.attempts.delete(key);
      }
    }
  }

  getRemainingAttempts(identifier: string, type: string = 'default'): number {
    const key = `${identifier}-${type}`;
    const entry = this.attempts.get(key);
    const maxAttempts = this.maxAttempts[type] || this.maxAttempts.default;
    
    if (!entry || Date.now() > entry.resetTime) {
      return maxAttempts;
    }
    
    return Math.max(0, maxAttempts - entry.count);
  }
}

// ===== SESSION PROVIDER: app/providers.tsx =====
'use client'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>
}

// ===== UPDATED TYPES: next-auth.d.ts =====
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      role: string[]
      username: string
      isEmailVerified: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string | null
    role: string[]
    username: string
    isEmailVerified: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string[]
    username: string
    isEmailVerified: boolean
  }
}



// ===== AUTH UTILITIES: lib/auth/utils.ts =====
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

export async function getRequiredServerSession() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function getOptionalServerSession() {
  return await getServerSession(authOptions)
}

export function requireRole(session: any, requiredRole: string) {
  if (!session?.user