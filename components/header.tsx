"use client"

import { useState } from 'react'
import { useSession, signOut } from "next-auth/react"
import Link from 'next/link'

import { SearchInHeader } from '@/components/utils/search'
import { useMobile } from "@/lib/units/use-mobile"
import { Menu, Search, ArrowLeft, LogOut, User, Bell, Mail } from 'lucide-react'

interface NavItem {
  name: string;
  icon: React.ComponentType < { className ? : string } > ;
  href ? : string;
}
interface Replenishment {
  last : any ;
}
interface HeaderProps {
  navlist: NavItem[];
  replacement?: Replenishment;
}

export default function Header({ navlist , replacement }: HeaderProps) {
  const [sideBarLogic, setSideBarOpenLogic] = useState < boolean > (false)
  const { data: session, status } = useSession()
  const isMobile = useMobile()
  
  const closeSidebar = () => setSideBarOpenLogic(false)
  
  return (
    <>
      {/* Header Bar */}
      <header
        className={`w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-gray-200 ${
          isMobile ? 'sticky top-0 z-40' : ''
        }`}
      >
        {/* ===== Left Section ===== */}
        <div className="flex items-center gap-3">
          <Menu
            className="w-6 h-6 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
            onClick={() => setSideBarOpenLogic(!sideBarLogic)}
          />
          <Link href="/" className="flex items-center gap-1">
            <h1 className="logo-style-font text-2xl font-semibold text-gray-800 cursor-pointer">
              historica
            </h1>
          </Link>
        </div>

        {/* ===== Right Section ===== */}
        
        
          {isMobile ? (
          <div className="flex items-center gap-4">
            <Search className="w-6 h-6 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors" />
            {session && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 justify-end">
            <SearchInHeader />

            {/* ===== Auth / Notifications Section ===== */}
            {status === "loading" ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded-full"></div>
            ) : session ? (
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
                  title="Messages"
                >
                  <Mail className="w-5 h-5" />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline transition-colors">
                    প্রবেশ করুন
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors">
                    নিবন্ধন করুন
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
        
        
      </header>

      {/* ===== Mobile Sidebar ===== */}
      {sideBarLogic && isMobile && (
        <div className="fixed inset-0 z-50 flex">
          {/* Sidebar Panel */}
          <div className="w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h1 className="logo-style-font text-xl font-semibold text-gray-800">
                historica
              </h1>
              <button onClick={closeSidebar}>
                <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navlist.map((item) => (
                <Link
                  key={item.name}
                  href={item.href || `/${item.name.toLowerCase()}`}
                  onClick={closeSidebar}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <item.icon className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize">
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Sidebar Footer */}
            {session && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    signOut()
                    closeSidebar()
                  }}
                  className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-gray-100 transition-colors text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Backdrop */}
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm"
            onClick={closeSidebar}
          />
        </div>
      )}
    </>
  )
}