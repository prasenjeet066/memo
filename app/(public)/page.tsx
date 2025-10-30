'use client'
import { Suspense } from 'react'
import * as d3 from "d3";
import Spinner from '/components/utils/spinner'
import Image from 'next/image'
import { Fai } from '@/components/Fontawesome';
import VA from '@/components/d3/VoronoiArt'
import Header from '@/components/header';
import StarBorder from '@/components/ui/star-border'
import GlobeChart from '@/components/d3/earth';
import { useMobile } from "@/lib/units/use-mobile";
import { Home, Compass, HandHeart, Settings } from 'lucide-react';
import { useState, useRef } from 'react';

const HeaderNavs = () => {
  const isMobile = useMobile();
  return (
    <>
      {!isMobile && (
        <button className="p-2 px-4 bg-gray-800 text-white rounded-full">
          <Fai icon="heart" className="mr-1" />
          Contribute Now!
        </button>
      )}
    </>
  );
};

export default function MainPage() {
  const isMobile = useMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState(null);
  const svgXMlurl = 'https://memoorg.vercel.app/api/img/vor';
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];
  
  const handleSearchSubmit = () => {};
  
  const handleSearch = (e) => {
    const value = e.target.value.trim();
    if (value) setSearchQuery(value);
  };
  
  
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
  const footerList = [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Content Security', href: '/security' },
    { label: 'Developers', href: '/developers' },
    { label: 'About Us', href: '/about' },
    { label: 'APIs', href: '/api-docs' },
  ];
  
  return ( <Suspense fallback={<Spinner/>}>
      <main className="min-h-screen w-full bg-gray-900 flex flex-col">
        <Header isDark = {true} navlist={NavList} isMobile={isMobile} />
        
        <div className="flex-1 flex overflow-hidden">
    
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
              {/* Image Section */}
              <div className="flex items-center justify-center w-full mb-8">
                <img
                  alt="Sample"
                  className={`h-auto object-contain rounded-lg ${isMobile ? 'w-full' : 'w-2/3'}`}
                  src="https://memoorg.vercel.app/api/img/vor"
                />
              </div>
              
              {/* Search Section */}
              <div className={`w-full ${isMobile ? 'max-w-full' : 'max-w-2xl'}`}>
                <h1 className="text-center text-white text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 ">
                  {
                    "Search anything..."
                  }
                </h1>
                
                <div className="w-full p-[1px] rounded-full bg-blue-600">
                  <div className="w-full p-2 flex items-center gap-2 bg-white rounded-full">
                    <input
                      type="text"
                      className="outline-none text-black border-none pl-4 bg-transparent flex-1 text-sm sm:text-base font-semibold"
                      placeholder="About Bangladesh"
                      value={searchQuery}
                      onChange={handleSearch}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    />
                    <button
                      className="bg-none px-2 hover:bg-indigo-700 text-white p-2 sm:p-3 rounded-full transition-colors flex-shrink-0"
                      onClick={handleSearchSubmit}
                    >
                      <Fai icon={'arrow-up'} className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            
          </div>
        </div>
           <footer className="w-full py-6 px-4 mt-auto text-white">
              <div className="max-w-6xl mx-auto">
                {!isMobile && (
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row justify-center gap-8'} items-center`}>
                  {footerList.map((item, index) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-sm text-whitw  transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>)}
                <div className="text-center mt-6 text-xs text-white">
                  © 2025 All rights reserved.
                </div>
              </div>
            </footer>
      </main>
    </Suspense>);
}
