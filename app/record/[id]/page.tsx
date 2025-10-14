'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Compass, HandHeart, Settings, FileText, TrendingUp, Clock, Star } from 'lucide-react'
import Header from '@/components/header'
import CreateNew from '@/components/record/create'

export default function RecordWithSlug({ params }) {
  const slug = params.id;
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]
  
  const Filters = [
    { id: 'all', label: 'All Records', icon: FileText },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'featured', label: 'Featured', icon: Star },
  ]
  
  if (slug === 'new') {
    return (
      <div className='min-h-screen w-full bg-gray-50'>
        <Header navList={NavList}/>
        <div className='w-full bg-white'>
          <CreateNew/>
        </div>
      </div>
    )
  }
  
  // Handle other slug cases
  return (
    <div className='min-h-screen w-full bg-gray-50'>
      <Header navList={NavList}/>
      <div className='w-full bg-white p-4'>
        <p>Record ID: {slug}</p>
        {/* Add your record display component here */}
      </div>
    </div>
  )
}