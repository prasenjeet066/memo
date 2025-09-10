'use client'

import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function MainPage() {
  const [sideBar, setSideBar] = useState<JSX.Element | null>(null)
  const isMobile = useMobile()
  const [isExpand, setIsExpand] = useState(true)

  const NavList = [
    {
      name: 'home',
      icon: Home,
    },
    {
      name: 'explore',
      icon: Compass,
    },
    {
      name: 'contribution',
      icon: HandHeart,
    },
    {
      name: 'setting',
      icon: Settings,
    },
  ]

  useEffect(() => {
    if (!isMobile) {
      setSideBar(
        <div className='p-2 flex flex-col items-start justify-start gap-2'>
          {NavList.map((nav) => (
            <div
              key={nav.name}
              className='flex flex-row items-center justify-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md'
            >
              <nav.icon className='w-5 h-5' />
              {isExpand && <span className='capitalize'>{nav.name}</span>}
            </div>
          ))}
        </div>
      )
    } else {
      setSideBar(null)
    }
  }, [isMobile, isExpand]) // ✅ only depend on these

  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex flex-row items-start justify-between">
        {sideBar}
        <div className='flex-1'>
          {/* main content goes here */}
        </div>
      </div>
    </main>
  )
}