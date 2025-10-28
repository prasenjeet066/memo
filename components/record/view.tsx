'use client'
import { useMobile } from "@/lib/units/use-mobile";
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
      _id ? : string
      title ? : string
      content ? : string
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
  const [activePaper , setActivePaper] = useState('overview')
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
      setData(d)
      
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
    return <div>Loading...</div>
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
  
  return (<div className="w-full h-full flex flex-col">
  {/* Header / Title */}
  <div className="px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <h1 className="font-bold text-gray-900 text-lg sm:text-xl md:text-2xl">
        {data.title || 'Untitled Article'}
      </h1>
      <div className="flex items-center border-l pl-2">
      {isEditableForMe ? (
      
        <button
          className="px-4 py-2 bg-gray-900 text-white  m-2 rounded-full text-sm sm:text-base"
          aria-label="Edit document"
          type="button"
          onClick={() => gotoEditPage(true)}
          title="Edit Article"
        >
          <Fai icon = 'arrow-right' className='mr-2'/>
          {'Edit Article'}
        </button>
      ) : (
        <button
          disabled={true}
          className="px-4 py-2 bg-gray-100 text-gray-600 transition-colors m-2 rounded-full text-sm sm:text-base flex items-center"
          title="Read-only access"
        >
          <Fai icon="lock" className="mr-2" />
          View Only
        </button>
      )}
    </div>
    </div>
  </div>

  {/* Action Buttons */}
  <div className = 'flex items-center justify-start'>
    <button onClick={()=>setActivePaper((prev)=> prev!=='overview' ? 'overview': prev)} className={'bg-none p-2 px-3 font-semibold ' + activePaper === 'overview' ? 'text-gray-900':'text-gray-500'}>{'Overview'}</button>
    <button onClick={()=>setActivePaper((prev)=> prev!=='discussion' ? 'discussion' : prev)} className={'bg-none p-2 px-3 font-semibold ' + activePaper === 'discussion' ? 'text-gray-900' : 'text-gray-500'}>{'Discussion'}</button>
  </div>
  {/* Article Content */}
  <div className="flex items-start justify-between">
    {activePaper === 'overview' ? (
    <div
      className={`flex-1 overflow-x-scroll bg-white relative prose max-w-none ${isMobile ? 'p-2' : 'p-4'}`}
      dangerouslySetInnerHTML={{ __html: data?.content || '<p>No content available yet.</p>' }}
    />
    ):null}
  </div>
</div>)
}