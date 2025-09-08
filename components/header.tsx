"use client"

import { useState, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
export default function Header({ context, user }) {
  
  const [ sideBarLogic , setSideBarOpenLogic] = useState();
  
  interface NavList {
    
  }
  const [_val, _eff] = context
  const NavList = [
    {
      name : 'Home',
    },
    {
      name : 'Explore'
    },
    {
      name : 'Contribution'
    }
  ]
  useEffect(() => {
    
  }, [_val])
  
  return (
    <div className = 'w-full p-2 flex flex-row items-center justify-between gap-4 sticky top-0 bg-white'>
      <div className = 'flex items-center gap-2'>
        <Menu className='w-5 h-5' onClick = {setSideBarOpenLogic(!sideBarLogic)}/>
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
      {
        sideBarLogic && NavList.length (
          <div className = ''>
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