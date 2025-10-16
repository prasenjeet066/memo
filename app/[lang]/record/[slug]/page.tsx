'use client'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import CreateNew from '@/components/record/create'
import React, { useState, useEffect } from 'react'

export default function RecordWithSlug({ params }) {
  const slug = params.slug;
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true);
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]
  const [sidebarElement, setSidebarElement] = useState()
  useEffect(()=>{
    setSidebarElement(Sidebar)
  },[Sidebar])
  const handleSideBarTools = (arg) => {
    setSidebarElement(arg);
  }
  const handlePublish = (payload: any) => {
    if (payload) {
      
      
    }
    return null
  }
  
  const Sidebar = 
    <div className='w-auto max-w-64 h-full bg-white mr-2 flex flex-col justify-between rounded-2xl'>
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
  
  
  if (slug === 'new') {
    
    return (
      <main className='h-screen w-full max-h-screen max-w-screen bg-gray-50'>
        <Header navList={NavList}/>
        <div className='p-4 w-full flex h-full items-start gap-2 justify-between'>
          <ErrorBoundary>
            <CreateNew
            onPublish = {handlePublish}
            ExpandedIs ={isExpanded}
            sideBarTools = {handleSideBarTools}
            IsExpandedSet= {setIsExpanded}
            />
          </ErrorBoundary>
          {!isMobile && sidebarElement}
        </div>
      </main>
    )
  }
  
  // Handle other slug cases
  return (
    <div className='min-h-screen w-full bg-gray-50 h-screen '>
      <Header navList={NavList}/>
      <div className='w-full h-full p-4 gap-2 flex items-start justify-start'>
        {Sidebar}
        <p>Record ID: {slug}</p>
        {/* Add your record display component here */}
      </div>
      
    </div>
  )
}