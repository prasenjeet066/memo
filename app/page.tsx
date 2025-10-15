// ===== FIXED: app/page.tsx =====
'use client'

import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import { useState } from 'react'

export default function MainPage() {
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true)
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]
  
  
  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex gap-2">
        
      </div>
    </main>
  )
}