// app/[locale]/layout.tsx
import React from 'react'
import '../globals.css'
import { AuthProvider } from '@/components/utils/provider/auth'
import { Metadata } from 'next'
import { locales } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
}

type Props = {
  children: React.ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function LocaleLayout({ children, params: { locale } }: Props) {
  return (
    <html lang={locale}>
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