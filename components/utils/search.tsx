import { Menu, Search, ArrowLeft} from 'lucide-react'

const SearchInHeader = () => {
  return (
    <>
      <div className='flex flex-row items-center justify-between border bg-white px-2 p-2 border-gray-700 rounded-xl'>
        <input type='text' className='bg-none border-none outline-none'/>
        <Search className='w-4 h-4  border-l text-gray-800'/>
      </div>
    </>
  )
}
export { SearchInHeader }