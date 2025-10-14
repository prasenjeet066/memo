'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import CreateNew from '@/components/record/create'

export default function RecordWithSlug({ params }) {
  const slug = params.id;
  if (slug === 'new') {
    return (
      <div className = 'min-h-screen w-full bg-gray-50'>
        <Header/>
        <div className = 'w-full bg-white'>
          <CreateNew/>
        </div>
      </div>
    )
  }
}