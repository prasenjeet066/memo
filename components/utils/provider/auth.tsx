'use client'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (<SessionProvider>{children}</SessionProvider>)
}

// ===== UPDATED TYPES: next-auth.d.ts =====
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image ? : string | null
      role: string[]
      username: string
      isEmailVerified: boolean
    }
  }
  
  interface User {
    id: string
    email: string
    name: string
    image ? : string | null
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