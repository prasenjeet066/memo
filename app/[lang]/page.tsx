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
  
  const Sidebar = !isMobile && (
    <div className='w-auto max-w-64 h-full bg-white ml-2 flex flex-col justify-between rounded-2xl'>
      <div className='p-4 border-b border-gray-200'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='text-xs text-gray-500 hover:text-gray-700 transition-colors'
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <nav className='flex-1 p-4 flex flex-col justify-between'>
        <div className='space-y-2 flex-1'>
          {NavList.slice(0, -1).map((nav) => (
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

        {/* Bottom nav item (Settings) */}
        <div>
          {(() => {
            const settings = NavList[NavList.length - 1]
            return (
              <a
                key={settings.name}
                href={settings.href}
                className='flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group'
              >
                <settings.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-800 flex-shrink-0' />
                {isExpanded && (
                  <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize'>
                    {settings.name}
                  </span>
                )}
              </a>
            )
          })()}
        </div>
      </nav>
    </div>
  )
  
  return (
    <main className="min-h-screen w-full h-screen bg-gray-50 flex flex-col">
      <Header navlist={NavList} />
      <div className="flex h-full w-full gap-2">
        {Sidebar}
        <div className='flex-1 p-6'>
          <div className='max-w-4xl mx-auto'>
          
          </div>
        </div>
      </div>
    </main>
  )
}