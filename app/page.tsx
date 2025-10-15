// ===== FIXED: app/page.tsx =====
'use client'

import { Fai } from '@/components/Fontawesome';
import Header from '@/components/header'
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
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]
  const handleSearch = () =>{}
  
  return (
  <main className="min-h-screen w-full bg-gray-50 flex flex-col">
    <Header navlist={NavList} replacement={{
    'last': HeaderNavs
    }} />
    <div className="w-full flex-1 flex flex-col items-center justify-center">
    <div className='p-4 space-y-2 w-full max-w-md'>
      <h1 className='text-center  text-2xl'>Find Anything.</h1>
      <div className={`w-full flex items-center justify-between gap-2 rounded-full p-2 bg-white`}>
        <input type='text' className='outline-none border-none pl-2 bg-transparent w-full' placeholder='About Bangladesh' />
        <button className='bg-gray-800 text-white p-2 rounded-full px-4' onClick = {handleSearch}>
          <Fai icon={'arrow-right'}/>
        </button>
      </div>
    </div>
    <div className = 'text-center w-full'>
      Footer
    </div>
  </div>
</main>)
}