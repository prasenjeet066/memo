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
    <html lang="en">
      <head>
        {/* Keep only fonts you actually need from link tags */}
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel='stylesheet' href='/font/Aminute/Web-TT/Aminute.css'/>
        <link href="https://db.onlinewebfonts.com/c/97e03bc37a8450b75b402cc4e579b2ad?family=ITC+Galliard+Roman" rel="stylesheet" type="text/css"/>
        <link rel = 'stylesheet' href = '/icon/css/all.min.css'/>
      </head>
      <style>
        {
          `

          @import url(https://db.onlinewebfonts.com/c/5d86f2e8ccc2811b9392aa03b7ce4a63?family=Styrene+B+Regular+Regular);
          @import url('https://fonts.cdnfonts.com/css/latin-modern-math');
          
          `
        }
      </style>
      <body>
          <Providers>
            {children}
          </Providers>
      </body>
    </html>
  )
}