'use client'
import { useMobile } from "@/lib/units/use-mobile";
import ClientMDX from '@/components/mdx'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react';
import { createEditor } from "lexical";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $generateHtmlFromNodes } from "@lexical/html";
import { Fai } from '@/components/Fontawesome';
import CreateNew from '@/components/record/createx'
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import Header from '@/components/header'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Props {
  __data: {
    data: {
      _id ? : string
      title ? : string
      content ? : string
      content_type ? : string
      protection_level ? : string
      summary ? : string
      categories ? : string[]
      tags ? : string[]
      infobox ? : any
      references ? : any[]
      external_links ? : any[]
    }
  }
}

export const Viewer = function({ __data }: Props) {
  const [data, setData] = useState < any > (null)
  const [editPage, gotoEditPage] = useState < boolean > (false)
  
  const [isExpanded, setIsExpanded] = useState(true)
  const isMobile = useMobile()
  const { data: session } = useSession();
  const [htmlContent , setHtmlContent] = useState(null)
  const [isSuccesfullCreated, setIsSuccesfullCreated] = useState < any > (null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [currentSidebar, setCurrentSidebar] = useState < React.ReactNode > (null)
  
  const NavList = useMemo(
    () => [
      { name: 'Home', icon: Home, href: '/' },
      { name: 'Explore', icon: Compass, href: '/explore' },
      { name: 'Contribute', icon: HandHeart, href: '/contribute' },
      { name: 'Settings', icon: Settings, href: '/settings' },
    ],
    []
  )
  const [activePaper, setActivePaper] = useState('overview')
  const handleSideBarTools = (arg: React.ReactNode) => {
    setCurrentSidebar(arg)
  }
  
  const whoCanEdit = {
    'NONE': ['IP', 'REG', 'AC', 'EC', 'ADMIN', 'BUC', 'CU', 'OS', 'TE', 'STEW', 'ARBC', 'BOT'],
    'SEMI': ['AC', 'EC', 'ADMIN', 'BUC', 'CU', 'OS', 'TE', 'STEW', 'ARBC', 'BOT'],
    'EXTENDED': ['EC', 'ADMIN', 'BUC', 'CU', 'OS', 'TE', 'STEW', 'ARBC', 'BOT'],
    'FULL': ['ADMIN'],
    'CASCADE': ['ADMIN'],
  }
  
  const [isEditableForMe, setEFM] = useState(false)
  
  const handlePublish = async (payload: any) => {
    if (!payload || !data) return null
    
    setIsPublishing(true)
    setIsSuccesfullCreated(null)
    
    try {
      const response = await fetch(`/api/publish/article/${data?.title || 'untitled'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          title: payload.title || data?.title || 'Untitled',
          articleId: data._id,
          editSummary: payload.summary || 'Updated article',
          isMinorEdit: payload.isMinorEdit || false,
        }),
      })
      
      const resData = await response.json()
      
      if (response.ok) {
        setIsSuccesfullCreated({
          success: true,
          message: 'Article updated successfully'
        })
        console.log('Article published successfully:', resData)
        
        // Optionally refresh the page or update state
        setTimeout(() => {
          window.location.href = `/record/${resData.slug || data._id}`
        }, 1500)
      } else {
        setIsSuccesfullCreated({ success: false, message: resData.error })
        console.error('Publish failed:', resData.error)
      }
    } catch (error) {
      console.error('Publish error:', error)
      setIsSuccesfullCreated({ success: false, message: 'An error occurred' })
    } finally {
      setIsPublishing(false)
    }
    
    return null
  }
  
  useEffect(() => {
    if (__data?.data) {
      const d = __data.data
      
      // Convert markdown to HTML if content_type is 'mkd'
      setData(d)
      
      // Set edit permissions
      const protectionLevel = d.protection_level || 'NONE'
      const allowedRoles = whoCanEdit[protectionLevel] || []
      
      if (session?.user) {
        const userRoles = Array.isArray(session.user.role) ? session.user.role : [session.user.role]
        // Check if any of the user's roles are allowed to edit
        const canEdit = userRoles.some(role => allowedRoles.includes(role))
        setEFM(canEdit)
      } else {
        // Check if anonymous users (IP) can edit
        setEFM(allowedRoles.includes('IP'))
      }
    }
  }, [__data, session])
  
  if (!data) {
    return <div className="flex w-full items-center justify-center h-screen">
      <div className="text-gray-600">Loading...</div>
    </div>
  }
  
  if (editPage) {
    return (
      <ErrorBoundary>
        <CreateNew
          __data={data}
          onPublish={handlePublish}
          ExpandedIs={isExpanded}
          record_name={data.title}
          sideBarTools={handleSideBarTools}
          isSuccesfullCreated={isSuccesfullCreated}
          IsExpandedSet={setIsExpanded}
        />
      </ErrorBoundary>
    )
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header / Title */}
      <div className="px-4 w-full py-3 flex items-center justify-between">
        {/* Left section — tit
        le */}
        <div className ='flex flex-col items-start gap-2'>
        <h1 className={`font-bold text-gray-900 truncate ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          {data.title || 'Untitled Article'}
        </h1>
        <small>{data.categories.join(',')}</small>
        </div>
        {/* Right section — actions */}
        <div className="flex items-center gap-4 border-l pl-4 ml-4">
          <button className="">
            <Fai icon="language" />
          </button>

          {isEditableForMe ? (
            <button
              className={`${!isMobile ? 'px-4 py-2 bg-gray-900 text-white rounded-full text-sm sm:text-base flex items-center gap-2' : 'flex items-center gap-4 border-l pl-4 ml-4'}`}
              aria-label="Edit document"
              type="button"
              onClick={() => gotoEditPage(true)}
              title="Edit Article"
            >
              <Fai icon="arrow-right" />
              {!isMobile && 'Edit'}
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm sm:text-base flex items-center gap-2 cursor-not-allowed"
              title="Read-only access"
            >
              <Fai icon="lock" />
              {!isMobile && 'Locked'}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex px-1 border-b pb-2 w-full mb-2 items-center gap-4 justify-start'>
        <button 
          onClick={() => setActivePaper('overview')} 
          className={`bg-none p-2 px-3 ${activePaper === 'overview' ? 'text-gray-900 border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActivePaper('discussion')} 
          className={`bg-none p-2 px-3 ${activePaper === 'discussion' ? 'text-gray-900 border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}
        >
          Discussion
        </button>
      </div>

      {/* Article Content */}
      <div className="flex items-start justify-between">
        {activePaper === 'overview' ? (
          <div
            className={`flex-1 overflow-x-auto bg-white relative prose max-w-none ${isMobile ? 'p-2' : 'p-4'}`}>
            <ClientMDX source = {data.content}/>
          </div>
        ) : (
          <div className={`flex-1 ${isMobile ? 'p-2' : 'p-4'}`}>
            <p className="text-gray-600">Discussion feature coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}