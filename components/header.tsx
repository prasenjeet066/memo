"use client"

import { useState } from 'react'
import { SearchInHeader } from '@/components/utils/search'
import { useMobile } from "@/lib/units/use-mobile"
import { Menu, Search, ArrowLeft, Home, Compass, HandHeart, Settings } from 'lucide-react'

export default function Header({ sideBar, setSideBar }) {
  const [sideBarLogic, setSideBarOpenLogic] = useState<boolean>(false)
  const [AuthData, setAuthData] = useState()
  const [isExpand, setIsExpand] = useState(true)
  const isMobile = useMobile()

  const NavList = [
    {
      name: 'home',
      icon: Home,
    },
    {
      name: 'explore',
      icon: Compass,
    },
    {
      name: 'contribution',
      icon: HandHeart,
    },
    {
      name: 'setting',
      icon: Settings,
    },
  ]

  // Render sidebar for non-mobile screens
  if (!isMobile && sideBar && setSideBar) {
    setSideBar(
      <>
        <div className='p-2 flex flex-col items-start justify-start gap-2'>
          {
            NavList.map((nav) => (
              <div key={nav.name} className='flex flex-row items-center justify-start gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md'>
                <nav.icon className='w-5 h-5' />
                {isExpand && <span className='capitalize'>{nav.name}</span>}
              </div>
            ))
          }
        </div>
      </>
    )
  }

  return (
    <div className='w-full p-4 flex flex-row items-center justify-between gap-4 sticky top-0 bg-white z-50 shadow-sm'>
      {isMobile ? (
        <>
          <div className='flex items-center gap-2'>
            <Menu className='w-5 h-5 cursor-pointer' onClick={() => { setSideBarOpenLogic(!sideBarLogic) }} />
            <h1 className='logo-style-font text-gray-800'>{"RecordCN"}</h1>
          </div>
          <div className='flex-1 flex flex-row items-center justify-end gap-2'>
            <Search className='h-5 w-5 cursor-pointer' />
          </div>
        </>
      ) : (
        <>
          <div className='flex flex-row items-center gap-4'>
            <h1 className='logo-style-font text-gray-800'>{"RecordCN"}</h1>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <SearchInHeader />
          </div>
        </>
      )}

      {/* Mobile Sidebar */}
      {sideBarLogic && NavList.length > 0 && (
        <div className='fixed top-0 left-0 w-full h-full flex flex-row z-50'>
          {/* Sidebar */}
          <div className='flex-1 p-6 min-h-screen bg-white flex flex-col items-start justify-start gap-4 shadow-lg'>
            <div className='flex flex-row items-center gap-2 justify-start font-semibold border-b pb-2 w-full'>
              <h1>{"Navigation"}</h1>
            </div>
            {
              NavList.map((item) => (
                <a key={item.name} href={`/${item.name}`} className='flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 w-full'>
                  <item.icon className='w-5 h-5' />
                  <span className='capitalize'>{item.name}</span>
                </a>
              ))
            }
          </div>

          {/* Backdrop */}
          <div className='min-w-[50%] bg-black/10 backdrop-blur-sm flex flex-col items-center justify-start'>
            <ArrowLeft
              className='m-4 h-8 w-8 p-2 bg-gray-700 rounded-full text-white cursor-pointer'
              onClick={() => { setSideBarOpenLogic(!sideBarLogic) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}