// ===== FIXED: app/page.tsx =====
'use client'

import { Fai } from '@/components/Fontawesome';
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
    <main className="min-h-screen w-full bg-gray-50 flex flex-col h-screen">
      <Header navlist={NavList} />
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className='p-4 space-y-2'>
        <h1 className='text-center font-[PPNeueMachina-ubold]'>Find Anything.</h1>
        <div className='input w-full flex items-center justify-between gap-2 rounded-full p-2 bg-white px-4'>
          <input type='text' className='outline-none border-none bg-none w-full' placeholder ='About Bangladesh'/>
          <button className='bg-gray-800 text-white p-2 rounded-full'>
            <Fai icon = 'arrow-right' style='fal'/>
          </button>
        </div>
        </div>
      </div>
    </main>
  )
}