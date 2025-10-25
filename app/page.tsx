'use client'
import { Suspense } from 'react'
import Image from 'next/image'
import { Fai } from '@/components/Fontawesome';
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
  
  return (
    <Suspense fallback ={<>null</>}>
    <main className="min-h-screen w-full bg-gray-50 flex flex-col h-screen">
      <Header navlist={NavList} />
      <div className="w-full flex-1 h-full flex flex-row items-center justify-between">
        <div class = 'flex flex-col w-full h-full items-center justify-center'>
<div className="relative flex flex-col items-center justify-center h-full w-full">
  <div className = 'flex items-center justify-center w-full h-full px-4'>
  <Image
    placeholder="blur"
    alt="null"
    className="w-2/3 h-auto object-contain"
    src="https://memoorg.vercel.app/api/img/vor"
    height={800}
    width={800}
  />
</div>
  {/* Responsive overlay input panel */}
  <div className=" flex-1 inset-0 flex items-center justify-center px-4 h-full">
    <div className="w-full max-w-md bg-none  rounded-lg p-4 sm:p-6 md:p-8">
      <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
        Find Anything.
      </h1>
      <div className="w-full p-[1px] rounded-full bg-gray-800">
        <div
          className={`w-full p-2 flex items-center gap-2 bg-white  rounded-full pl-3 ${
            !isMobile ? "bg-white/50 backdrop-blur-md" : "bg-white"
          }`}
        >
          <input
            type="text"
            className="outline-none border-none pl-2 bg-transparent w-full text-sm sm:text-base"
            placeholder="About Bangladesh"
            onInput={handleSearch}
          />
          <button
            className="bg-indigo-600 text-white p-2 rounded-full px-4 text-sm sm:text-base"
            onClick={handleSearchSubmit}
          >
            <Fai icon="arrow-up" />
          </button>
        </div>
      </div>
    </div>
  
          
        </div>
        </div>
        {/* ✅ Fixed footer layout (centers last item properly) */}
        </div>
      </div>
    </main>
    </Suspense>
  );
}