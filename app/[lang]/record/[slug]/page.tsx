'use client'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import CreateNew from '@/components/record/createx'
import React, { useState, useEffect, useMemo } from 'react'

// Define proper types for params
interface RecordWithSlugProps {
  params: {
    slug: string
  }
  searchParam?: {
    new?: string
  }
}

export default function RecordWithSlug({ params, searchParam }: RecordWithSlugProps) {
  const slug = params.slug
  const ArticleName = searchParam?.new?.trim() || ''
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true)

  const NavList = useMemo(() => [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ], [])

  // ✅ Use useMemo for Sidebar (prevents re-renders)
  const Sidebar = useMemo(() =>
    <div className='w-auto max-w-64 h-full bg-white mr-2 flex flex-col justify-between rounded-2xl'>
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
  , [isExpanded, NavList])

  const [currentSidebar, setCurrentSidebar] = useState<React.ReactNode>(Sidebar)
  const [isSuccesfullCreated, setIsSuccesfullCreated] = useState<boolean | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  const handleSideBarTools = (arg: React.ReactNode) => {
    setCurrentSidebar(arg)
  }

  const handlePublish = async (payload: any) => {
    if (!payload) return null

    setIsPublishing(true)
    setIsSuccesfullCreated(null)

    try {
      const response = await fetch(`/api/publish/article/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          title: ArticleName,
          articleId: ArticleName.replace(/\s+/g, '-').toLowerCase(),
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccesfullCreated(true)
        console.log('Article published successfully:', data)
      } else {
        setIsSuccesfullCreated(false)
        console.error('Publish failed:', data.error)
      }
    } catch (error) {
      console.error('Publish error:', error)
      setIsSuccesfullCreated(false)
    } finally {
      setIsPublishing(false)
    }

    return null
  }

  // ✅ Fix logic condition (safe and avoids runtime error)
  if (slug === 'create' || ArticleName !== '') {
    return (
      <ErrorBoundary>
        <main className='h-screen w-full max-h-screen max-w-screen bg-gray-50'>
          <Header navList={NavList} />
          <div className='p-4 w-full flex h-full items-start gap-2 justify-between'>
            <CreateNew
              onPublish={handlePublish}
              ExpandedIs={isExpanded}
              record_name={ArticleName}
              sideBarTools={handleSideBarTools}
              isSuccesfullCreated={isSuccesfullCreated}
              IsExpandedSet={setIsExpanded}
            />
          </div>
        </main>
      </ErrorBoundary>
    )
  }

  const [isExistArticel, setEA] = useState(false)
  const [recordJdata, setRecordJdata] = useState<any>(null)

  // ✅ Fix useEffect (must not use await directly; correctly fetch data)
  useEffect(() => {
    const fetchRecord = async () => {
      if (!slug) return
      try {
        const feRecord = await fetch(`/api/record/${slug}`)
        if (feRecord.ok) {
          const recordData = await feRecord.json()
          setEA(true)
          setRecordJdata(recordData.data)
        } else {
          setEA(false)
        }
      } catch (e) {
        console.error('Error fetching record:', e)
        setEA(false)
      }
    }

    fetchRecord()
  }, [slug])

  // ✅ UI unchanged
  return (
    <div className='min-h-screen w-full bg-gray-50 h-screen'>
      <Header navList={NavList} />
      <div className='w-full h-full p-4 gap-2 flex items-start justify-start'>
        {isExistArticel && recordJdata ? JSON.stringify(recordJdata) : null}
      </div>
    </div>
  )
}