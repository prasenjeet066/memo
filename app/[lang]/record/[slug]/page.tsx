'use client'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import Header from '@/components/header'
import { Viewer } from '@/components/record/view'
import { useMobile } from "@/lib/units/use-mobile"
import CreateNew from '@/components/record/createx'
import Spinner from '/components/utils/spinner'

import React, { useState, useEffect, useMemo } from 'react'

// Define proper types for params
interface RecordWithSlugProps {
  params: {
    slug: string
  }
  searchParams ? : {
    new ? : string
  }
}

export default function RecordWithSlug({ params, searchParams }: RecordWithSlugProps) {
  const slug = params.slug
  const ArticleName = searchParams?.new?.trim() || ''
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(false)
  const footerList = [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Content Security', href: '/security' },
    { label: 'Developers', href: '/developers' },
    { label: 'About Us', href: '/about' },
    { label: 'APIs', href: '/api-docs' },
  ];
  const NavList = useMemo(() => [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ], [])
  
  // Use useMemo for Sidebar (prevents re-renders)
  const Sidebar = useMemo(() =>
    <div className='w-auto max-w-64 h-full bg-white mr-2 flex flex-col justify-between rounded-2xl rounded-l-none'>
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
                <span className='text-sm font-semibold text-gray-700 group-hover:text-gray-900 capitalize'>
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
    </div>, [isExpanded, NavList])
  
  const [currentSidebar, setCurrentSidebar] = useState < React.ReactNode > (Sidebar)
  const [isSuccesfullCreated, setIsSuccesfullCreated] = useState < any > (null)
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
          title: ArticleName || payload.title,
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsSuccesfullCreated({
          success: true,
          articleId: data.articleId,
          slug: data.slug
        })
        console.log('Article published successfully:', data)
      } else {
        setIsSuccesfullCreated({
          success: false,
          message: data.error
        })
        console.error('Publish failed:', data.error)
      }
    } catch (error) {
      console.error('Publish error:', error)
      setIsSuccesfullCreated({ success: false, message: 'An error occurred' })
    } finally {
      setIsPublishing(false)
    }
    
    return null
  }
  
  //  Fix logic condition (safe and avoids runtime error)
  if (slug === 'create' || ArticleName !== '') {
    return (
      <ErrorBoundary>
        <main className='h-screen w-full max-h-screen max-w-screen bg-gray-50'>
          <Header navList={NavList} />
          <div className='p-1 w-full flex h-full items-start gap-2 justify-between'>
            <CreateNew
              onPublish={handlePublish}
              ExpandedIs={isExpanded}
              record_name={ArticleName}
              sideBarTools={handleSideBarTools}
              isSuccesfullCreated={isSuccesfullCreated}
              IsExpandedSet={setIsExpanded}
            />
          </div>
             <footer className="w-full bg-white py-6 px-4 mt-auto">
              <div className="max-w-6xl mx-auto">
                {!isMobile && (
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row justify-center gap-8'} items-center`}>
                  {footerList.map((item, index) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>)}
                <div className="text-center mt-6 text-xs text-gray-500">
                  © 2025 All rights reserved.
                </div>
              </div>
            </footer>
        </main>
      </ErrorBoundary>
    )
  }
  
  const [isExistArticel, setEA] = useState(false)
  const [recordJdata, setRecordJdata] = useState < any > (null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fix useEffect (must not use await directly; correctly fetch data)
  useEffect(() => {
    const fetchRecord = async () => {
      if (!slug) return
      
      setIsLoading(true)
      try {
        const feRecord = await fetch(`/api/record/${slug}`)
        if (feRecord.ok) {
          const recordData = await feRecord.json()
          setEA(true)
          setRecordJdata(recordData)
        } else {
          setEA(false)
          setRecordJdata(null)
        }
      } catch (e) {
        console.error('Error fetching record:', e)
        setEA(false)
        setRecordJdata(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRecord()
  }, [slug])
  
  if (isLoading) {
    return (
      <Spinner/>
    )
  }
  
  if (isExistArticel && recordJdata) {
    return (
      <ErrorBoundary>
        <div className='min-h-screen w-full bg-gray-50 h-screen'>
          <Header navList={NavList} />
         
          <div className='p-4 w-full flex h-full items-start gap-2 justify-between'>
            { ! isMobile && Sidebar}
            <Viewer __data={recordJdata} />
          </div>
              <footer className="w-full bg-white py-6 px-4 mt-auto">
              <div className="max-w-6xl mx-auto">
                {!isMobile && (
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row justify-center gap-8'} items-center`}>
                  {footerList.map((item, index) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>)}
                <div className="text-center mt-6 text-xs text-gray-500">
                  © 2025 All rights reserved.
                </div>
              </div>
            </footer>
        </div>
      </ErrorBoundary>
    )
  }
  
  return (
  <ErrorBoundary>  
  <div className='min-h-screen w-full bg-gray-50 h-screen'>  
    <Header navList={NavList} />  
    
    <div className='p-1 w-full flex h-full items-start justify-between'>  
      {!isMobile && Sidebar}  
      <div className='flex-1 flex bg-white flex-col gap-4 p-4 w-full h-full'>  
        <h1 className='text-2xl sm:text-xl md:text-lg lg:text-2xl font-bold '>
          Sorry!
        </h1>
        <h1 className='text-base sm:text-lg md:text-xl lg:text-2xl font-semibold'>
          Your request not found.
        </h1>  
        <div className='p-4 flex items-start gap-4 justify-center bg-white rounded'>  
          <h1 className='text-sm sm:text-base md:text-lg'>
            It looks like you don’t have any articles yet. Would you like to create a new one?
          </h1>   <br/>
          <a 
            href={`/record/create?new=${slug.trim()}`} 
            className='text-sm sm:text-base md:text-lg text-blue-600 font-bold hover:underline'
          >
            Create Article
          </a>  
        </div>  
        
        <h1 className='text-base sm:text-lg md:text-xl lg:text-2xl border-b p-2 font-bold'>  
          Related Articles
        </h1>  
        
        <div className='w-full p-4'>
           
        </div>  
      </div>  
    </div>  
    <footer className="w-full bg-white py-6 px-4 mt-auto">
              <div className="max-w-6xl mx-auto">
                {!isMobile && (
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row justify-center gap-8'} items-center`}>
                  {footerList.map((item, index) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>)}
                <div className="text-center mt-6 text-xs text-gray-500">
                  © 2025 All rights reserved.
                </div>
              </div>
            </footer>
  </div>  
</ErrorBoundary>
  )
}