import { Search } from 'lucide-react'

const SearchInHeader = () => {
  return (
    <div className='flex items-center bg-gray-100 border border-gray-200 rounded-full px-4 py-2 min-w-[300px] hover:border-gray-300 focus-within:border-blue-500 transition-colors'>
      <input 
        type='text' 
        className='flex-1 bg-transparent text-sm outline-none placeholder-gray-500' 
        placeholder='রেকর্ড সন্ধান করুন..'
      />
      <Search className='w-4 h-4 ml-2 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors'/>
    </div>
  )
}

export { SearchInHeader }