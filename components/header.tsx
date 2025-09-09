"use client"
import { getServerAuthContext } from '@/lib/units/auth-context'
import { useTranslation } from 'react-i18next';

import { useState, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
export default function Header() {
  
  const [sideBarLogic, setSideBarOpenLogic] = useState < boolean > (false);
  const [AuthData, setAuthData] = useState()
  const { t } = useTranslation('common')
  const NavList = [
  {
    name: t('home'),
  },
  {
    name: t('explore')
  },
  {
    name: t('contribution')
  },
  {
    name: t('setting'),
    
  },
  ]
  useEffect(() => {
    getServerAuthContext((isAuth, data) => {
      setAuthData({
        isAuth,
        data
      })
    })
  }, [])
  return (
    <div className = 'w-full p-4 flex flex-row items-center justify-between gap-4 sticky top-0 bg-white'>
      <div className = 'flex items-center gap-2'>
        <Menu className='w-5 h-5' onClick = {()=>{setSideBarOpenLogic(!sideBarLogic)}}/>
        <h1 className = 'logo-style-font text-gray-800'>{"recordCN"}</h1>
      </div>
      <div className = 'flex-1 flex flex-row items-center justify-end gap-2'>
        <Search className='h-5 w-5'/>
        
      </div>
      {
        sideBarLogic && NavList.length && (
          <div className = 'fixed top-0 left-0 w-1/2 min-h-screen bg-white flex flex-col items-start justify-start gap-4'>
            {
              NavList.map((item)=>(
              <a href={`${item.name}`}>
                {item.name}
              </a>
                )
              )
            }
          </div>
        )
      }
    </div>
  )
}