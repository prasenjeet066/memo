"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import {ErrorBoundary} from '@/components/ErrorBoundary'
import Header from '@/components/header';
import CreateRecord from '@/components/record/create';
import { useMobile } from "@/lib/units/use-mobile";
import {
  Home,
  Compass,
  HandHeart,
  Settings,
  Edit,
  Eye,
  History,
  Share2,
  Bookmark,
  Flag,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Tag,
  Clock,
  TrendingUp,
  Star,
  MessageSquare,
  Link as LinkIcon,
  Shield,
  FileSearch,
  Plus
} from 'lucide-react';

interface RecordData {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  status: string;
  categories: string[];
  tags: string[];
  viewCount: number;
  editCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function RecordIdPage({ params }) {
  const router = useRouter();
  const record_slug = params.id;
  const searchParams = useSearchParams();
  const isMobile = useMobile();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [recordData, setRecordData] = useState < RecordData | null > (null);
  const [loading, setLoading] = useState(true);
  const [recordExists, setRecordExists] = useState(true);
  const [activeSection, setActiveSection] = useState < string > ('tools');
  
  const recordName = searchParams.get('r_n');
  const editingMode = searchParams.get('e_mode');
  
  useEffect(() => {
    if (record_slug && record_slug !== 'create') {
      fetchRecordData();
    } else {
      setLoading(false);
    }
  }, [record_slug]);
  
  const fetchRecordData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API call
      const response = await fetch(`/api/records/${record_slug}`);
      
      if (!response.ok) {
        setRecordExists(false);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setRecordData(data);
      setRecordExists(true);
    } catch (error) {
      console.error('Error fetching record:', error);
      setRecordExists(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateRecord = () => {
    router.push(`/record/create?record=${encodeURIComponent(record_slug)}&editing_mode=true`);
  };
  
  const NavList = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Compass, href: '/explore' },
    { name: 'Contribute', icon: HandHeart, href: '/contribute' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];
  
  const RecordTools = [
  {
    name: 'Edit',
    icon: Edit,
    onClick: () => router.push(`/record/${record_slug}/edit`),
    color: 'text-blue-600'
  },
  {
    name: 'View History',
    icon: History,
    onClick: () => router.push(`/record/${record_slug}/history`),
    color: 'text-gray-600'
  },
  {
    name: 'Watch',
    icon: Bookmark,
    onClick: () => { /* Add watch functionality */ },
    color: 'text-yellow-600'
  },
  {
    name: 'Share',
    icon: Share2,
    onClick: () => { /* Add share functionality */ },
    color: 'text-green-600'
  },
  {
    name: 'Report Issue',
    icon: Flag,
    onClick: () => router.push(`/record/${record_slug}/report`),
    color: 'text-red-600'
  }, ];
  
  const RecordInfo = recordData ? [
    { label: 'Views', value: recordData.viewCount.toLocaleString(), icon: Eye },
    { label: 'Edits', value: recordData.editCount, icon: Edit },
    { label: 'Status', value: recordData.status, icon: FileText },
    { label: 'Created', value: new Date(recordData.createdAt).toLocaleDateString(), icon: Clock },
  ] : [];
  
  const SidebarSection = ({ title, icon: Icon, children, isOpen, onToggle }) => (
    <div className='border-b border-gray-200'>
      <button
        onClick={onToggle}
        className='w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors'
      >
        <div className='flex items-center gap-2'>
          <Icon className='w-4 h-4 text-gray-600' />
          {isExpanded && (
            <span className='text-sm font-semibold text-gray-700'>{title}</span>
          )}
        </div>
        {isExpanded && (
          isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />
        )}
      </button>
      {isOpen && isExpanded && (
        <div className='px-3 pb-3'>
          {children}
        </div>
      )}
    </div>
  );
  
  const Sidebar = !isMobile && recordData && (
    <div className='w-auto max-w-72 min-h-screen bg-white border-l border-gray-200 flex flex-col'>
      <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-700'>
          {isExpanded ? 'Record Tools' : 'Tools'}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='text-xs text-gray-500 hover:text-gray-700 transition-colors'
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {/* Tools Section */}
        <SidebarSection 
          title="Tools" 
          icon={FileSearch}
          isOpen={activeSection === 'tools'}
          onToggle={() => setActiveSection(activeSection === 'tools' ? '' : 'tools')}
        >
          <div className='space-y-1'>
            {RecordTools.map((tool) => (
              <button
                key={tool.name}
                onClick={tool.onClick}
                className='w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group'
              >
                <tool.icon className={`w-4 h-4 ${tool.color} flex-shrink-0`} />
                <span className='text-sm text-gray-700 group-hover:text-gray-900'>
                  {tool.name}
                </span>
              </button>
            ))}
          </div>
        </SidebarSection>

        {/* Statistics Section */}
        <SidebarSection 
          title="Statistics" 
          icon={TrendingUp}
          isOpen={activeSection === 'stats'}
          onToggle={() => setActiveSection(activeSection === 'stats' ? '' : 'stats')}
        >
          <div className='space-y-2'>
            {RecordInfo.map((info) => (
              <div key={info.label} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <info.icon className='w-3.5 h-3.5 text-gray-500' />
                  <span className='text-xs text-gray-600'>{info.label}</span>
                </div>
                <span className='text-xs font-medium text-gray-900'>{info.value}</span>
              </div>
            ))}
          </div>
        </SidebarSection>

        {/* Categories Section */}
        {recordData.categories.length > 0 && (
          <SidebarSection 
            title="Categories" 
            icon={Tag}
            isOpen={activeSection === 'categories'}
            onToggle={() => setActiveSection(activeSection === 'categories' ? '' : 'categories')}
          >
            <div className='flex flex-wrap gap-1.5'>
              {recordData.categories.map((category) => (
                <a
                  key={category}
                  href={`/records/category/${category}`}
                  className='px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors'
                >
                  {category}
                </a>
              ))}
            </div>
          </SidebarSection>
        )}

        {/* Tags Section */}
        {recordData.tags.length > 0 && (
          <SidebarSection 
            title="Tags" 
            icon={Tag}
            isOpen={activeSection === 'tags'}
            onToggle={() => setActiveSection(activeSection === 'tags' ? '' : 'tags')}
          >
            <div className='flex flex-wrap gap-1.5'>
              {recordData.tags.map((tag) => (
                <a
                  key={tag}
                  href={`/records/tag/${tag}`}
                  className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors'
                >
                  #{tag}
                </a>
              ))}
            </div>
          </SidebarSection>
        )}

        {/* Quick Links */}
        <SidebarSection 
          title="Quick Links" 
          icon={LinkIcon}
          isOpen={activeSection === 'links'}
          onToggle={() => setActiveSection(activeSection === 'links' ? '' : 'links')}
        >
          <div className='space-y-1'>
            <a href={`/record/${record_slug}/talk`} className='block text-xs text-blue-600 hover:underline'>
              Discussion
            </a>
            <a href={`/record/${record_slug}/contributors`} className='block text-xs text-blue-600 hover:underline'>
              Contributors
            </a>
            <a href={`/record/${record_slug}/related`} className='block text-xs text-blue-600 hover:underline'>
              Related Records
            </a>
            <a href={`/record/${record_slug}/citations`} className='block text-xs text-blue-600 hover:underline'>
              Citations
            </a>
          </div>
        </SidebarSection>

        {/* Protection Info */}
        <SidebarSection 
          title="Protection" 
          icon={Shield}
          isOpen={activeSection === 'protection'}
          onToggle={() => setActiveSection(activeSection === 'protection' ? '' : 'protection')}
        >
          <div className='text-xs text-gray-600'>
            <p className='mb-1'>This record is currently:</p>
            <span className='px-2 py-1 bg-green-50 text-green-700 rounded inline-block'>
              Unprotected
            </span>
          </div>
        </SidebarSection>
      </div>
    </div>
  );
  
  if (!record_slug || record_slug.trim() === '') {
    router.push('/record');
    return null;
  }
  
  // Handle create mode
  // Handle create mode
  if (record_slug === 'create' && recordName && editingMode) {
    const CreateTools = [
    {
      name: 'Save Draft',
      icon: FileText,
      onClick: () => {
        // Save draft logic here
        console.log("Saving draft...");
      },
      color: 'text-green-600',
    },
    {
      name: 'Preview',
      icon: Eye,
      onClick: () => {
        // Preview logic here
        console.log("Preview record...");
      },
      color: 'text-blue-600',
    },
    {
      name: 'Formatting Help',
      icon: MessageSquare,
      onClick: () => {
        // Open formatting guide
        window.open('/docs/formatting', '_blank');
      },
      color: 'text-purple-600',
    },
    {
      name: 'Cancel Creation',
      icon: Flag,
      onClick: () => router.push('/record'),
      color: 'text-red-600',
    }, ];
    
    const SideTools = !isMobile && (
      <div className="w-auto max-w-72 min-h-screen bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {isExpanded ? 'Creation Tools' : 'Tools'}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Creation Tools Section */}
        <SidebarSection
          title="Creation Tools"
          icon={Edit}
          isOpen={activeSection === 'tools'}
          onToggle={() =>
            setActiveSection(activeSection === 'tools' ? '' : 'tools')
          }
        >
          <div className="space-y-1">
            {CreateTools.map((tool) => (
              <button
                key={tool.name}
                onClick={tool.onClick}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <tool.icon className={`w-4 h-4  flex-shrink-0`} />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {tool.name}
                </span>
              </button>
            ))}
          </div>
        </SidebarSection>

        {/* Tips Section */}
        <SidebarSection
          title="Tips"
          icon={Star}
          isOpen={activeSection === 'tips'}
          onToggle={() =>
            setActiveSection(activeSection === 'tips' ? '' : 'tips')
          }
        >
          <div className="text-xs text-gray-600 space-y-2">
            <p>✅ Use clear, descriptive titles</p>
            <p>💡 Summarize the record’s purpose in 1–2 sentences</p>
            <p>🧩 Add categories and tags for better discoverability</p>
            <p>📚 Include references or sources when possible</p>
          </div>
        </SidebarSection>
      </div>
    </div>
    );
    
    return (
      <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex bg-white">
        <div className="flex-1 px-3 border-r">
          <div className="max-w-4xl mx-auto">
            <ErrorBoundary>
              <CreateRecord recordName={recordName} editingMode={editingMode} />
        
            </ErrorBoundary>
            </div>
        </div>
        
      </div>
    </main>
    );
  }
  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen w-full bg-gray-50">
        <Header navlist={NavList} />
        <div className="flex bg-white">
          <div className='flex-1 p-6'>
            <div className='max-w-4xl mx-auto'>
              <div className='animate-pulse'>
                <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
                <div className='h-4 bg-gray-200 rounded w-full mb-2'></div>
                <div className='h-4 bg-gray-200 rounded w-5/6'></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  // Record doesn't exist - show create option
  if (!recordExists) {
    
    return (
      <main className="min-h-screen w-full bg-gray-50">
        <Header navlist={NavList} />
        <div className="flex bg-white min-h-[calc(100vh-64px)]">
          <div className='flex-1 p-6 flex items-center justify-center'>
            <div className='max-w-2xl mx-auto text-center'>
              <div className='mb-6'>
                <FileSearch className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                  Record Not Found
                </h1>
                <p className='text-gray-600 mb-1'>
                  The record "<span className='font-semibold'>{decodeURI(record_slug)}</span>" doesn't exist yet.
                </p>
                <p className='text-gray-500 text-sm'>
                  Would you like to create it?
                </p>
              </div>
              
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6'>
                <h2 className='text-lg font-semibold text-blue-900 mb-2'>
                  Create New Record
                </h2>
                <p className='text-sm text-blue-700 mb-4'>
                  Start documenting knowledge about "{decodeURI(record_slug)}". Your contribution will help build a comprehensive knowledge base.
                </p>
                <button
                  onClick={handleCreateRecord}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
                >
                  <Plus className='w-5 h-5' />
                  Create "{decodeURI(record_slug)}"
                </button>
              </div>

              <div className='text-left bg-gray-50 rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-gray-900 mb-2'>
                  Before creating a record:
                </h3>
                <ul className='text-sm text-gray-600 space-y-1 list-disc list-inside'>
                  <li>Make sure the record doesn't already exist with a different name</li>
                  <li>Use clear, descriptive titles</li>
                  <li>Provide accurate and well-sourced information</li>
                  <li>Follow community guidelines and formatting standards</li>
                </ul>
              </div>

              <div className='mt-6 pt-6 border-t border-gray-200'>
                <p className='text-sm text-gray-500 mb-3'>Or explore existing records:</p>
                <div className='flex gap-3 justify-center'>
                  <a
                    href='/record'
                    className='px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm'
                  >
                    Browse Records
                  </a>
                  <a
                    href='/explore'
                    className='px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm'
                  >
                    Explore
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  // Display existing record
  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header navlist={NavList} />
      <div className="flex bg-white">
        <div className='flex-1 p-6'>
          <div className='max-w-4xl mx-auto'>
            {/* Record Header */}
            <div className='mb-6'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                {recordData.title}
              </h1>
              <p className='text-gray-600 text-sm'>
                {recordData.summary}
              </p>
            </div>

            {/* Record Content */}
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='prose max-w-none'>
                {recordData.content}
              </div>
            </div>

            {/* Mobile Tools */}
            {isMobile && (
              <div className='mt-6 grid grid-cols-2 gap-3'>
                {RecordTools.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={tool.onClick}
                    className='flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <tool.icon className={`w-4 h-4 ${tool.color}`} />
                    <span className='text-sm text-gray-700'>{tool.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {Sidebar}
      </div>
    </main>
  );
}