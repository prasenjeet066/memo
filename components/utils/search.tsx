import { Menu, Search, ArrowLeft} from 'lucide-react'

const SearchInHeader = () => {
  return (
    <>
      <div className='flex flex-row justify-between border bg-white rounded-xl'>
        <input type='text' className='bg-none border-none outline-none'/>
        <Search className='w-4 h-4 p-2 border-l'/>
      </div>
    </>
  )
}
export { SearchInHeader }