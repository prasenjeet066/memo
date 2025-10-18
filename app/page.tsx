// ===== FIXED: app/page.tsx =====
'use client'

import { Fai } from '@/components/Fontawesome';
import Header from '@/components/header'
import GlobeChart from '@/components/d3/earth'
import { useMobile } from "@/lib/units/use-mobile"
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import { useState } from 'react'

const HeaderNavs = () => {
  const isMobile = useMobile()
  return (
    
    <>
      {
        !isMobile ? (
          <>
            <button className = ' p-2 px-4  bg-gray-800 text-white rounded-full'>
              <Fai icon = 'heart' className='mr-1'/>
              {'Contribute Now!'}
            </button>
          </>
        ) : null
      }
      
    </>
  )
}
export default function MainPage() {
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState(null)
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]
  const handleSearchSubmit = () => {}
  const handleSearch = (e) => {
    if (e.target.value || e.target.value.trim() !== '') {
      setSearchQuery(e.target.value)
    }
  }
  const footerList = [
  {
    label: ' Terms & Conditions'
  },
  {
    label: 'Content Security'
  },
  {
    label: 'Developers'
  },
  {
    label: 'About us'
  },
  {
    label: 'APIs'
  }]
  return (
    <main className="min-h-screen w-full bg-gray-50 flex flex-col">
    <Header navlist={NavList}/>
    <div className="w-full flex-1 flex flex-col items-center justify-center">
      <GlobeChart SearchCountry= {searchQuery}/>
    <div className='p-4 space-y-2 w-full max-w-md'>
      
      <h1 className='text-center  text-2xl mt-4 font-semibold'>Find Anything.</h1>
      <div className={`w-full flex items-center justify-between gap-2 rounded-full p-2 bg-white/50 backdrop:blur-md`}>
        <input type='text' className='outline-none border-none pl-2 bg-transparent w-full' placeholder='About Bangladesh'  onInput = {handleSearch}/>
        <button className='bg-gray-800 text-white p-2 rounded-full px-4' onClick = {handleSearchSubmit}>
          <Fai icon={'arrow-right'}/>
        </button>
      </div>
    </div>
<div className="w-full px-6 py-4 text-center text-xs text-gray-700">
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 place-items-center">
    {footerList.map((list, index) => (
      <a
        key={index}
        href={list.href || '#'}
        className="p-2 hover:text-blue-600 after:content-['_↗'] transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {list.label}
      </a>
    ))}
  </div>
</div>
  </div>
</main>)
}