"use client"

import { useState,useEffect } from 'react'
import { useSession } from "next-auth/react"

import { SearchInHeader } from '@/components/utils/search'
import { useMobile } from "@/lib/units/use-mobile"
import { Menu, Search, ArrowLeft, Home, Compass, HandHeart, Settings } from 'lucide-react'

export default function Header({ navlist }) {
  const [sideBarLogic, setSideBarOpenLogic] = useState<boolean>(false)
  const { data: session, status } = useSession()
  const [AuthData, setAuthData] = useState()
  const [isExpand, setIsExpand] = useState(true)
  const isMobile = useMobile()
  
  
  // Render sidebar for non-mobile screens
  const NavList = navlist;

  return (
    <div className='w-full p-4 flex flex-row items-center justify-between gap-4 sticky top-0 bg-white z-50 border-b'>
      {isMobile ? (
        <>
          <div className='flex items-center gap-2'>
            <Menu className='w-5 h-5 cursor-pointer' onClick={() => { setSideBarOpenLogic(!sideBarLogic) }} />
            <h1 className='logo-style-font text-gray-800'>{"record"}</h1>
          </div>
          <div className='flex-1 flex flex-row items-center justify-end gap-2'>
            <Search className='h-5 w-5 cursor-pointer' />
          </div>
        </>
      ) : (
        <>
          <div className='flex flex-row items-center gap-4'>
            <h1 className='logo-style-font text-gray-800'>{"record"}</h1>
          </div>
          <div className='flex flex-row items-center gap-4'>
            <SearchInHeader />
            <div className = 'flex gap-2 flex-row items-center justify-end'>
              {
              status ? (
                <>
                  <button className='bg-none border-none outline-none px-4 hover:underline text-semibold'>
                    {"প্রবেশ করুন"}
                  </button>
                  <button className='bg-gray-800 text-white px-4 rounded-full p-2 outline-none'>
                    {"নিবন্ধন করুন"}
                  </button>
                </>
                
              ):(
                <></>
              )
              }
            </div>
          </div>
        </>
      )}

      {/* Mobile Sidebar */}
      {sideBarLogic && NavList.length > 0 && (
        <div className='fixed top-0 left-0 w-full h-full flex flex-row z-50'>
          {/* Sidebar */}
          <div className='flex-1 p-4 min-h-screen bg-white flex flex-col items-start justify-start gap-4 shadow-lg'>
            <div className='flex flex-col items-start gap-2 justify-start font-semibold pb-2 w-full'>
              
              <h1 className='logo-style-font border-b'>{"record"}</h1>
        
            </div>
            {
              NavList.map((item) => (
                <a key={item.name} href={`/${item.name}`} className='flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 w-full text-sm'>
                  <item.icon className='w-4 h-4' />
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