'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import CreateNew from '@/components/record/create'

export default function RecordWithSlug({ params }) {
  const slug = params.id;
  if (slug === 'new') {
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
    return (
      <div className = 'min-h-screen w-full bg-gray-50'>
        <Header navList = {NavList}/>
        <div className = 'w-full bg-white'>
          <CreateNew/>
        </div>
      </div>
    )
  }
}