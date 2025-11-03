"use client"

import { useState } from 'react'
import { useSession, signOut } from "next-auth/react"
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { SearchInHeader } from '@/components/utils/search'
import { useMobile } from "@/lib/units/use-mobile"
import { Menu, Search, ArrowLeft, LogOut, User, Bell, Mail } from 'lucide-react'

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
      {/* Header Bar */}
      <header
        className={`w-full px-4 py-3 flex items-center justify-between ${
          isDark ? 'bg-transparent text-white' : 'bg-gray-50 text-gray-800'
        } ${isMobile ? 'sticky top-0 z-40' : ''}`}
      >
        {/* ===== Left Section ===== */}
        <div className="flex items-center gap-3">
          {isMobile && (
          <Menu
            className={`w-6 h-6 cursor-pointer transition-colors ${
              isDark ? 'text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={() => setSideBarOpenLogic(!sideBarLogic)}
          />)}
          <Link href="/" className="flex items-center gap-1">
            <h1
              className={`logo-style-font text-3xl px-2 font-semibold cursor-pointer ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}
            >
              S
            </h1>
          </Link>
        </div>

        {/* ===== Right Section ===== */}
        {isMobile ? (
          <div className="flex items-center gap-4">
            <Search
              className={`w-6 h-6 cursor-pointer transition-colors ${
                isDark ? 'text-white' : 'text-gray-700 hover:text-gray-900'
              }`}
            />
            {session && (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                <User className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 justify-end">
            {
              !pathname === '/' && <SearchInHeader />
            }
            

            {/* ===== Auth / Notifications Section ===== */}
            {status === "loading" ? (
              <div
                className={`w-20 h-8 rounded-full animate-pulse ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              ></div>
            ) : session ? (
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'text-white hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title="Messages"
                >
                  <Mail className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'text-white hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <div
                  className={`flex items-center gap-2 p-2 border-l ${
                    isDark ? 'border-gray-600' : 'border-gray-300'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full ${
                      isDark ? 'bg-gray-500' : 'bg-gray-500'
                    }`}
                  ></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button
                    className={`px-4 py-2 text-sm font-medium hover:underline transition-colors ${
                      isDark
                        ? 'text-white hover:text-gray-300'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <button
                    className={`p-1 px-4  text-sm font-medium bg-blue-600 text-white rounded-full transition-colors ${
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

      {/* ===== Mobile Sidebar ===== */}
      {sideBarLogic && isMobile && (
        <div className="fixed inset-0 z-50 flex">
          {/* Sidebar Panel */}
          <div
            className={`w-full max-w-full flex flex-col ${
              isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
            }`}
          >
            {/* Sidebar Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <h1 className="logo-style-font text-xl font-semibold">S</h1>
              <button onClick={closeSidebar}>
                <ArrowLeft
                  className={`w-6 h-6 transition-colors ${
                    isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navlist.map((item) => (
                <Link
                  key={item.name}
                  href={item.href || `/${item.name.toLowerCase()}`}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                    isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-800'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium capitalize ${
                      isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                    }`}
                  >
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
                      ? 'hover:bg-gray-800 text-red-400 hover:text-red-500'
                      : 'hover:bg-gray-100 text-red-600 hover:text-red-700'
                  }`}
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