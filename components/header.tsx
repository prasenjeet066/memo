"use client"

import { useState, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
export default function Header({ context, user }) {
  const [_val, _eff] = context
  useEffect(() => {
    
  }, [_val])
  
  return (
    <div className = 'w-full p-2 flex flex-row items-center justify-between gap-4 sticky top-0 bg-white'>
      <div className = 'flex items-center gap-2'>
        <Menu className='w-5 h-5'/>
        <h1 className = 'logo-style-font text-gray-800'>{"recordCN"}</h1>
      </div>
      <div className = 'flex-1 flex items-center gap-2'>
        <Search className='h-5 w-5'/>
        {
          user &&  (
            <>
              authed
            </>
          )
        }
      </div>
    </div>
  )
}