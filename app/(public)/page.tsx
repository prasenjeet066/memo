'use client'
import { Suspense } from 'react'
import Spinner from '/components/utils/spinner'
import { Fai } from '@/components/Fontawesome';
import Header from '@/components/header';
import { useMobile } from "@/lib/units/use-mobile";
import { Home, Compass, HandHeart, Settings } from 'lucide-react';
import { useState } from 'react';

export default function MainPage() {
  const isMobile = useMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];
  
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // Handle search submission
      console.log('Searching for:', searchQuery);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent < HTMLInputElement > ) => {
    setSearchQuery(e.target.value);
  };
  
  const Sidebar = !isMobile && (
    <aside className='w-auto max-w-64 h-full min-h-screen bg-white border-r border-gray-200 flex flex-col justify-between'>
      <div className='p-4 border-b border-gray-200'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='text-xs text-gray-500 hover:text-gray-700 transition-colors'
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <nav className='flex-1 p-4 flex flex-col justify-between'>
        <div className='space-y-1 flex-1'>
          {NavList.slice(0, -1).map((nav) => (
            <a
              key={nav.name}
              href={nav.href}
              className='flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group'
            >
              {!isExpanded ? (
                <div className='rounded-full p-2 h-10 w-10 bg-gray-50 flex items-center justify-center'>
                  <nav.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-900' />
                </div>
              ) : (
                <nav.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-900' />
              )}
              {isExpanded && (
                <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize'>
                  {nav.name}
                </span>
              )}
            </a>
          ))}
        </div>

        {/* Settings at bottom */}
        <div className='border-t border-gray-200 pt-4'>
          {(() => {
            const settings = NavList[NavList.length - 1]
            return (
              <a
                key={settings.name}
                href={settings.href}
                className='flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group'
              >
                <settings.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-900' />
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
    </aside>
  )
  
  const footerList = [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Content Security', href: '/security' },
    { label: 'Developers', href: '/developers' },
    { label: 'About Us', href: '/about' },
    { label: 'APIs', href: '/api-docs' },
  ];
  
  return (
    <Suspense fallback={<Spinner/>}>
      <main className="min-h-screen w-full bg-gray-50 flex flex-col">
        <Header navlist={NavList} />
        
        <div className="flex-1 flex overflow-hidden">
          {Sidebar}
          
          <div className="flex-1 flex flex-col overflow-y-auto bg-white">
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
              {/* Main Search Section */}
              <div className={`w-full ${isMobile ? 'max-w-full px-4' : 'max-w-2xl'}`}>
                <h1 className="text-center text-gray-900 text-3xl sm:text-4xl md:text-5xl font-bold mb-8">
                  Search anything...
                </h1>
                
                <div className="w-full bg-gray-50 rounded-full p-2 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="outline-none border-none pl-4 bg-transparent flex-1 text-sm sm:text-base text-gray-900 placeholder-gray-500"
                      placeholder="About Bangladesh"
                      value={searchQuery}
                      onChange={handleSearch}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    />
                    <button
                      className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full transition-colors flex-shrink-0"
                      onClick={handleSearchSubmit}
                      aria-label="Search"
                    >
                      <Fai icon='arrow-up' className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-sm text-gray-500">Popular:</span>
                  {['History', 'Science', 'Technology', 'Culture'].map((topic) => (
                    <button
                      key={topic}
                      className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                      onClick={() => setSearchQuery(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="w-full bg-white border-t border-gray-200 py-6 px-4">
          <div className="max-w-6xl mx-auto">
            {!isMobile && (
              <div className="flex flex-row justify-center gap-8 items-center">
                {footerList.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
            <div className="text-center mt-4 text-xs text-gray-500">
              © 2025 Sistorica. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </Suspense>
  );
}