import Header from '@/components/header'
import { useState } from 'react'
export default async function MainPage() {
  const [sideBar,setSideBar] = useState(null)
  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header sideBar={sideBar} setSideBar={setSideBar}/>
      <div className="flex flex-row items-center justify-between">
        {
          sideBar!==null &&  sideBar 
        }
        <div className='flex-1'>
          
        </div>
      </div>
    </main>
  )
}