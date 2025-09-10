// app/[locale]/layout.tsx
import React from 'react'
import './globals.css'
import { Providers } from '@/components/utils/provider/auth'
import { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
}

type Props = {
  children: React.ReactNode
}



export default function LocaleLayout({ children }: Props) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Intel+One+Mono:ital,wght@0,300..700;1,300..700&display=swap" rel="stylesheet"/>
        <link rel='stylesheet' href='/font/Aminute/Web-TT/Aminute.css'/>
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}