// app/[locale]/layout.tsx
import React from 'react'
import './globals.css'
import { Providers } from '@/components/utils/provider/auth'
import { Metadata } from 'next'
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // lets you use in Tailwind config
})

export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
}

type Props = {
  children: React.ReactNode
}

export default function LocaleLayout({ children }: Props) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Keep only fonts you actually need from link tags */}
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel='stylesheet' href='/font/Aminute/Web-TT/Aminute.css'/>
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}