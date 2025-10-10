
'use client'

import Header from '@/components/header'
import CreateRecord from '@/components/record/create'
import { useMobile } from "@/lib/units/use-mobile"
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import { useState } from 'react'

export default function RecordIdPage({params}) {
  const record_slug = params.id;
  if (!record_slug || record_slug.trim()==='') {
    
    // back to /record page
  }
 
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true)
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]
  
  const Sidebar = !isMobile && (
    <div className='w-auto max-w-64 min-h-screen bg-white mr-2 flex flex-col justify-between'>
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
  if (record_slug === 'create') {
   return (
     <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex bg-white">
        {Sidebar}
        <div className='flex-1 p-2 ml-1'>
          <div className='max-w-4xl mx-auto'>
            <CreateRecord/>
          </div>
        </div>
      </div>
    </main>
   )
 }
  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex bg-white">
        {Sidebar}
        <div className='flex-1 p-6'>
          <div className='max-w-4xl mx-auto'>
            <h1 className='text-2xl font-bold text-gray-900 mb-6'>Search records.</h1>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <p className='text-gray-600'>{record_slug}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}