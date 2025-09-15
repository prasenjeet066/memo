// ===== FIXED: app/page.tsx =====
'use client'

import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function MainPage() {
  const [sideBar, setSideBar] = useState<JSX.Element | null>(null)
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true)

  const NavList = [
    {
      name: 'Home',
      icon: Home,
      href: '/'
    },
    {
      name: 'Explore',
      icon: Compass,
      href: '/explore'
    },
    {
      name: 'Contribute',
      icon: HandHeart,
      href: '/contribute'
    },
    {
      name: 'Settings',
      icon: Settings,
      href: '/settings'
    },
  ]

  useEffect(() => {
    if (!isMobile) {
      setSideBar(
        <div className='w-auto max-w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col'>
          {/* Sidebar Header */}
          <div className='p-4 border-b border-gray-200'>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className='text-xs text-gray-500 hover:text-gray-700 transition-colors'
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          {/* Navigation */}
          <nav className='flex-1 p-4'>
            <div className='space-y-2'>
              {NavList.map((nav) => (
                <a
                  key={nav.name}
                  href={nav.href}
                  className='flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group'
                >
                  <nav.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-800 flex-shrink-0' />
                  {isExpanded && (
                    <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize'>
                      {nav.name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )
    } else {
      setSideBar(null)
    }
  }, [isMobile, isExpanded])

  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex">
        {sideBar}
        <div className='flex-1 p-6'>
          <div className='max-w-4xl mx-auto'>
            <h1 className='text-2xl font-bold text-gray-900 mb-6'>Welcome to Record</h1>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <p className='text-gray-600'>Main content goes here...</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
