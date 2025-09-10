import { Menu, Search, ArrowLeft} from 'lucide-react'

const SearchInHeader = () => {
  return (
    <>
      <div className='flex flex-row items-center justify-between border bg-white  p-2 px-4 bg-gray-100 rounded-full '>
        <input type='text' className='bg-none border-none text-sm outline-none'/>
        <Search className='w-4 h-4  border-l text-gray-800'/>
      </div>
    </>
  )
}
export { SearchInHeader }