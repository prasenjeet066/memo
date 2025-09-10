import { Menu, Search, ArrowLeft} from 'lucide-react'

const SearchInHeader = () => {
  return (
    <>
      <div className='flex flex-row items-center justify-between border bg-white  p-2 px-4 bg-gray-100 rounded-full '>
        <input type='text' className='bg-none border-none text-sm outline-none' placeholder='Search anything..'/>
        <Search className='w-5 h-5 pl-2 border-l text-gray-800'/>
      </div>
    </>
  )
}
export { SearchInHeader }