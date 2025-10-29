'use client'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import Header from '@/components/header'
import { Viewer } from '@/components/record/view'
import { useMobile } from "@/lib/units/use-mobile"
import CreateNew from '@/components/record/createx'
import Spinner from '/components/utils/spinner'

import React, { useState, useEffect, useMemo } from 'react'
/**
 * Main Account Page
 * @readonly 
 */
const Account = () => {
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(false)
  const footerList = [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Content Security', href: '/security' },
    { label: 'Developers', href: '/developers' },
    { label: 'About Us', href: '/about' },
    { label: 'APIs', href: '/api-docs' },
  ];
  const NavList = useMemo(() => [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ], [])
  
  const Sidebar = useMemo(() =>
    <div className='w-auto max-w-64 h-full bg-white mr-2 flex flex-col justify-between rounded-2xl rounded-l-none'>
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
                <span className='text-sm font-semibold text-gray-700 group-hover:text-gray-900 capitalize'>
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
    </div>, [isExpanded, NavList])
  return (
    <ErrorBoundary>
        <div className='min-h-screen w-full bg-gray-50 h-screen'>
          <Header navList={NavList} />
         
          <div className='p-4 w-full flex h-full items-start gap-2 justify-between'>
            { ! isMobile && Sidebar}
            </div>
            </div>
            </ErrorBoundary>
  )
}