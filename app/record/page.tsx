'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import { 
  Home, 
  Compass, 
  HandHeart, 
  Settings,
  Search,
  TrendingUp,
  Clock,
  Star,
  FileText,
  Tag,
  Filter,
  Plus,
  ChevronRight
} from 'lucide-react'

interface RecordItem {
  id: string
  title: string
  slug: string
  summary: string
  status: string
  categories: string[]
  viewCount: number
  editCount: number
  qualityRating?: string
  createdAt: Date
  updatedAt: Date
}

export default function RecordPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [records, setRecords] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(false)
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]

  const Filters = [
    { id: 'all', label: 'All Records', icon: FileText },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'featured', label: 'Featured', icon: Star },
  ]

  useEffect(() => {
    fetchRecords()
  }, [activeFilter])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      // Replace with your actual API call
      const response = await fetch(`/api/records?filter=${activeFilter}`)
      const data = await response.json()
      setRecords(data.records || [])
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/record/${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleCreateRecord = () => {
    router.push('/record/create?record=New Record&editing_mode=true')
  }
  
  const Sidebar = !isMobile && (
    <div className='w-auto max-w-64 min-h-screen bg-white mr-2 flex flex-col justify-between'>
      <div className='p-4 border-b border-gray-200'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='text-xs text-gray-500 hover:text-gray-700 transition-colors'
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <nav className='flex-1 p-4 flex flex-col justify-between'>
        <div className='space-y-2 flex-1'>
          {NavList.slice(0, -1).map((nav) => (
            <a
              key={nav.name}
              href={nav.href}
              className='flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group'
            >
              <nav.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-800 flex-shrink-0' />
              {isExpanded && (
                <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize'>
                  {nav.name}
                </span>
              )}
            </a>
          ))}
        </div>

        <div>
          {(() => {
            const settings = NavList[NavList.length - 1]
            return (
              <a
                key={settings.name}
                href={settings.href}
                className='flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group'
              >
                <settings.icon className='w-5 h-5 text-gray-600 group-hover:text-gray-800 flex-shrink-0' />
                {isExpanded && (
                  <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize'>
                    {settings.name}
                  </span>
                )}
              </a>
            )
          })()}
        </div>
      </nav>
    </div>
  )

  const RecordCard = ({ record }: { record: RecordItem }) => (
    <div 
      onClick={() => router.push(`/record/${record.slug}`)}
      className='bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer'
    >
      <div className='flex items-start justify-between mb-2'>
        <h3 className='text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors'>
          {record.title}
        </h3>
        {record.qualityRating && (
          <span className='px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded'>
            {record.qualityRating}
          </span>
        )}
      </div>
      
      <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
        {record.summary}
      </p>
      
      <div className='flex items-center justify-between text-xs text-gray-500'>
        <div className='flex items-center gap-3'>
          <span className='flex items-center gap-1'>
            <FileText className='w-3.5 h-3.5' />
            {record.editCount} edits
          </span>
          <span className='flex items-center gap-1'>
            <TrendingUp className='w-3.5 h-3.5' />
            {record.viewCount.toLocaleString()} views
          </span>
        </div>
        <ChevronRight className='w-4 h-4' />
      </div>
      
      {record.categories.length > 0 && (
        <div className='flex flex-wrap gap-1 mt-3'>
          {record.categories.slice(0, 3).map((category) => (
            <span 
              key={category}
              className='px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded'
            >
              {category}
            </span>
          ))}
          {record.categories.length > 3 && (
            <span className='px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded'>
              +{record.categories.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
  
  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex bg-white">
        {Sidebar}
        <div className='flex-1 p-6'>
          <div className='max-w-6xl mx-auto'>
            {/* Header Section */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900 mb-2'>Records</h1>
                  <p className='text-gray-600'>
                    Browse, search, and create knowledge records
                  </p>
                </div>
                <button
                  onClick={handleCreateRecord}
                  className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <Plus className='w-5 h-5' />
                  Create Record
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className='mb-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search or create a record...'
                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <p className='text-xs text-gray-500 mt-2'>
                  Press Enter to search. If the record doesn't exist, you'll have the option to create it.
                </p>
              </form>

              {/* Filters */}
              <div className='flex items-center gap-2 overflow-x-auto pb-2'>
                {Filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      activeFilter === filter.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <filter.icon className='w-4 h-4' />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Records Grid */}
            {loading ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className='bg-white rounded-lg border border-gray-200 p-4 animate-pulse'>
                    <div className='h-6 bg-gray-200 rounded w-3/4 mb-2'></div>
                    <div className='h-4 bg-gray-200 rounded w-full mb-1'></div>
                    <div className='h-4 bg-gray-200 rounded w-5/6'></div>
                  </div>
                ))}
              </div>
            ) : records.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {records.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  No records found
                </h3>
                <p className='text-gray-600 mb-4'>
                  Be the first to create a record!
                </p>
                <button
                  onClick={handleCreateRecord}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <Plus className='w-5 h-5' />
                  Create Your First Record
                </button>
              </div>
            )}

            {/* Quick Stats */}
            {records.length > 0 && (
              <div className='mt-8 grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-white rounded-lg border border-gray-200 p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <FileText className='w-4 h-4 text-blue-600' />
                    <span className='text-xs text-gray-600'>Total Records</span>
                  </div>
                  <p className='text-2xl font-bold text-gray-900'>{records.length}</p>
                </div>
                
                <div className='bg-white rounded-lg border border-gray-200 p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <TrendingUp className='w-4 h-4 text-green-600' />
                    <span className='text-xs text-gray-600'>Total Views</span>
                  </div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {records.reduce((acc, r) => acc + r.viewCount, 0).toLocaleString()}
                  </p>
                </div>
                
                <div className='bg-white rounded-lg border border-gray-200 p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Tag className='w-4 h-4 text-purple-600' />
                    <span className='text-xs text-gray-600'>Categories</span>
                  </div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {new Set(records.flatMap(r => r.categories)).size}
                  </p>
                </div>
                
                <div className='bg-white rounded-lg border border-gray-200 p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Star className='w-4 h-4 text-yellow-600' />
                    <span className='text-xs text-gray-600'>Featured</span>
                  </div>
                  <p className='text-2xl font-bold text-gray-900'>
                    {records.filter(r => r.qualityRating === 'FA' || r.qualityRating === 'GA').length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}