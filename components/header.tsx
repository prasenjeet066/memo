"use client"

import { useState } from 'react'
import { useSession, signOut } from "next-auth/react"
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { SearchInHeader } from '@/components/utils/search'
import { useMobile } from "@/lib/units/use-mobile"
import { Fai } from '@/components/Fontawesome'

interface NavItem {
  name: string;
  icon: React.ComponentType < { className ? : string } > ;
  href ? : string;
}

interface Replenishment {
  last: any;
}

interface HeaderProps {
  navlist: NavItem[];
  replacement ? : Replenishment;
  isDark ? : boolean;
}

export default function Header({ navlist, replacement, isDark = false }: HeaderProps) {
  const [sideBarLogic, setSideBarOpenLogic] = useState < boolean > (false)
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isMobile = useMobile()
  
  const closeSidebar = () => setSideBarOpenLogic(false)
  
  return (
    <>
      {/* Header Bar - Fixed positioning issues */}
      <header
        className={`w-full px-4 py-3 flex items-center justify-between bg-gray-50 ${
          isDark ? 'bg-transparent text-white border-gray-700' : 'bg-gray-50 text-gray-800'
        } ${isMobile ? 'sticky top-0 z-40' : ''}`}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setSideBarOpenLogic(!sideBarLogic)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Fai 
                icon='bars'
                className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`}
              />
            </button>
          )}
          <Link href="/" className="flex items-center">
            <h1
              className={`logo-style-font text-2xl font-semibold cursor-pointer ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}
            >
              
            </h1>
          </Link>
        </div>

        {/* Right Section */}
        {isMobile ? (
          <div className="flex items-center gap-3">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Fai 
                icon='search'
                className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`}
              />
            </button>
            {session && (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                <Fai icon='user' className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {pathname !== '/' && <SearchInHeader />}

            {status === "loading" ? (
              <div
                className={`w-20 h-8 rounded-full animate-pulse ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
            ) : session ? (
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'text-white hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Messages"
                  aria-label="Messages"
                >
                  <Fai icon='envelope' className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'text-white hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Fai icon='bell' className="w-5 h-5" />
                </button>
                <div
                  className={`flex items-center gap-2 pl-2 ml-2 border-l ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <Fai icon='user' className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                      isDark
                        ? 'text-white hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      isDark
                        ? 'bg-white text-gray-900 hover:bg-gray-200'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    Register
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Sidebar - Fixed overlay and positioning */}
      {sideBarLogic && isMobile && (
        <div className="fixed inset-0 z-50 flex">
          {/* Sidebar Panel */}
          <div
            className={`w-full max-w-sm flex flex-col ${
              isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
            } shadow-2xl`}
          >
            {/* Sidebar Header */}
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <h1 className="logo-style-font text-2xl font-semibold">S</h1>
              <button 
                onClick={closeSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <Fai 
                  icon='times'
                  className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navlist.map((item) => (
                <Link
                  key={item.name}
                  href={item.href || `/${item.name.toLowerCase()}`}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  />
                  <span className="text-sm font-medium capitalize">
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Sidebar Footer */}
            {session && (
              <div
                className={`p-4 border-t ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={() => {
                    signOut()
                    closeSidebar()
                  }}
                  className={`flex items-center gap-3 p-3 w-full rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-gray-800 text-red-400'
                      : 'hover:bg-gray-100 text-red-600'
                  }`}
                >
                  <Fai icon='sign-out' className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Backdrop */}
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={closeSidebar}
          />
        </div>
      )}
    </>
  )
}