import React from 'react'
import './globals.css'
import { AuthProvider } from '@/components/utils/provider/auth'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <link rel='stylesheet' href='/font/Aminute/Web-TT/Aminute.css'/>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

export default RootLayout;