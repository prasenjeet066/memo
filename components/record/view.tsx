'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react';
import { Fai } from '@/components/Fontawesome';
import CreateNew from '@/components/record/createx'
import { Home, Compass, HandHeart, Settings } from 'lucide-react'
import Header from '@/components/header'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Props {
  __data: {
    data: {
      title ? : string
      content ? : string
      protection_level ? : string
    }
  }
}

export const Viewer = function({ __data }: Props) {
  const [data, setData] = useState < any > (null)
  const [editPage, gotoEditPage] = useState < boolean > (false)
  
  const [isExpanded, setIsExpanded] = useState(true)
  const { data: session } = useSession();
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
    if (!payload) return null
    
    setIsPublishing(true)
    setIsSuccesfullCreated(null)
    
    try {
      const response = await fetch(`/api/publish/article/${data?.title || 'untitled'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          title: data?.title || 'Untitled',
          articleId: data._id,
        }),
      })
      
      const resData = await response.json()
      
      if (response.ok) {
        setIsSuccesfullCreated({ success: true })
        console.log('Article published successfully:', resData)
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
      setData(d)
      
      if (session?.user) {
        const allowedRoles = whoCanEdit[d.protection_level ?? 'NONE'] || []
        setEFM(allowedRoles.includes(session.user.role))
      } else {
        setEFM(false)
      }
    }
  }, [__data, session])
  
  if (!data) {
    return <div>Loading...</div>
  }
  
  if (editPage) {
    return (
      <ErrorBoundary>
        <main className="h-screen w-full max-h-screen max-w-screen bg-gray-50">
          <Header navList={NavList} />
          <div className="p-4 w-full flex h-full items-start gap-2 justify-between">
            <CreateNew
              __data={data}
              onPublish={handlePublish}
              ExpandedIs={isExpanded}
              record_name={data.title}
              sideBarTools={handleSideBarTools}
              isSuccesfullCreated={isSuccesfullCreated}
              IsExpandedSet={setIsExpanded}
            />
          </div>
        </main>
      </ErrorBoundary>
    )
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">{data.title}</h1>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 w-full rounded-full px-2 py-1">
        <div className="flex items-center w-full flex-1"></div>
        <div className="flex items-center border-l pl-2">
          { isEditableForMe ? (
            <button
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors m-2 rounded-full"
              aria-label="Edit document"
              type="button"
              onClick={() => gotoEditPage(true)}
              title="Edit Article"
            >
              Edit Article
            </button>
          ) : (
            <button
              disabled={true}
              className="px-4 py-2 bg-gray-100 text-black transition-colors m-2 rounded-full"
            >
              <Fai icon="lock" />
              {'Only View'}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div
          className="flex-1 overflow-auto bg-white relative prose max-w-none"
          dangerouslySetInnerHTML={{ __html: data?.content || '' }}
        />
        
      </div>
    </div>
  )
}