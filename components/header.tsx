// ===== FIXED: components/header.tsx =====
"use client"

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from 'next/link'

import { SearchInHeader } from '@/components/utils/search'
import { useMobile } from "@/lib/units/use-mobile"
import { Menu, Search, ArrowLeft, LogOut, User,Bell,Mail } from 'lucide-react'

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

interface HeaderProps {
  navlist: NavItem[];
}

export default function Header({ navlist }: HeaderProps) {
  const [sideBarLogic, setSideBarOpenLogic] = useState<boolean>(false)
  const { data: session, status } = useSession()
  const isMobile = useMobile()
  
  // Close sidebar when clicking outside or on navigation
  const closeSidebar = () => setSideBarOpenLogic(false)
  
  return (
    <>
      <div className='w-full px-4 py-3 flex flex-row items-center justify-between gap-4 sticky top-0 bg-gray-50 z-40'>
        {isMobile ? (
          <>
            <div className='flex items-center gap-3'>
              <Menu 
                className='w-6 h-6 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors' 
                onClick={() => setSideBarOpenLogic(!sideBarLogic)} 
              />
              <Link href="/">
                <h1 className='logo-style-font text-xl font-semibold text-gray-800 cursor-pointer'>record</h1>
              </Link>
            </div>
            <div className='flex items-center gap-3'>
              <Search className='w-6 h-6 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors' />
              {session && (
                <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'>
                  <User className='w-4 h-4 text-gray-600' />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className='flex items-center gap-4'>
              <Menu className='w-6 h-6 text-gray-700' onClick= {()=>setSideBarOpenLogic(!sideBarLogic)}/>
              <Link href="/">
                <h1 className='logo-style-font text-xl font-semibold text-gray-800 cursor-pointer'>record</h1>
              </Link>
            </div>
            
            <div className='flex items-center gap-4'>
              <SearchInHeader />
              <div className='flex items-center gap-3'>
                {status === "loading" ? (
                  <div className='w-20 h-8 bg-gray-200 animate-pulse rounded-full'></div>
                ) : session ? (
                  <div className='flex items-center gap-4'>
                  <button className='flex items-center gap-2 px-3 rounded-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 rounded-lg transition-colors'>
                    <Mail className='w-4 h-4 mr-2'/>
                    {"Messages"}
                  </button>
                  <button className='flex items-center gap-2 px-3 rounded-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 rounded-lg transition-colors'>
                    <Bell className='w-4 h-4 mr-2'/>
                    {"Notifications"}
                  </button>
                    <button 
                      onClick={() => signOut()}
                      className='flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
                    >
                      <LogOut className='w-4 h-4' />
                      
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <button className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline transition-colors'>
                        প্রবেশ করুন
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className='px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors'>
                        নিবন্ধন করুন
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sideBarLogic && isMobile && (
        <div className='fixed inset-0 z-50 flex'>
          {/* Sidebar */}
          <div className='w-80 max-w-[85vw] bg-white shadow-xl flex flex-col'>
            {/* Sidebar Header */}
            <div className='p-4 border-b border-gray-200'>
              <div className='flex items-center justify-between'>
                <h1 className='logo-style-font text-xl font-semibold text-gray-800'>record</h1>
                <button onClick={closeSidebar}>
                  <ArrowLeft className='w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors' />
                </button>
              </div>
              {session && (
                <div className='mt-3 flex items-center gap-3'>
                  <Bell className='h-5 w-5'/>
                  <Mail className='h-5 w-5'/>
                </div>
              )}
            </div>

            {/* Navigation Items */}
            <div className='flex-1 p-4'>
              <nav className='space-y-2'>
                {navlist.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href || `/${item.name.toLowerCase()}`}
                    onClick={closeSidebar}
                    className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors group'
                  >
                    <item.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-800' />
                    <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize'>
                      {item.name}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Sidebar Footer */}
            {session && (
              <div className='p-4 border-t border-gray-200'>
                <button 
                  onClick={() => {
                    signOut()
                    closeSidebar()
                  }}
                  className='flex items-center gap-3 p-3 w-full rounded-lg hover:bg-gray-100 transition-colors text-red-600 hover:text-red-700'
                >
                  <LogOut className='w-5 h-5' />
                </button>
              </div>
            )}
          </div>

          {/* Backdrop */}
          <div 
            className='flex-1 bg-black/20 backdrop-blur-sm'
            onClick={closeSidebar}
          />
        </div>
      )}
    </>
  )
}