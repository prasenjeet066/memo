// ===== COMPLETE: app/account/page.tsx =====
'use client'

import Header from '@/components/header'
import { useMobile } from "@/lib/units/use-mobile"
import { Home, Compass, HandHeart, Settings, User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Shield, Bell, Globe, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Account() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isMobile = useMobile()
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        location: session.user.location || '',
        bio: session.user.bio || '',
        avatar: session.user.image || ''
      })
    }
  }, [session, status, router])
  
  const NavList = [
    { name: 'Profile', icon: Home, id: 'profile' },
    { name: 'Preference', icon: Compass, id: 'preference' },
    { name: 'Contributions', icon: HandHeart, id: 'contributions' },
    { name: 'Account Settings', icon: Settings, id: 'settings' },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    // API call to save profile data
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      if (response.ok) {
        setIsEditing(false)
        // Show success message
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }
  
  const Sidebar = !isMobile && (
    <div className='w-auto max-w-64 h-full bg-white ml-2 flex flex-col justify-between rounded-2xl'>
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

        {/* Bottom nav item (Settings) */}
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

  // Mobile Tab Navigation
  const MobileTabNav = isMobile && (
    <div className='bg-white border-b border-gray-200 sticky top-0 z-10 overflow-x-auto'>
      <div className='flex gap-1 p-2 min-w-max'>
        {NavList.map((nav) => (
          <button
            key={nav.id}
            onClick={() => setActiveTab(nav.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === nav.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <nav.icon className='w-4 h-4 flex-shrink-0' />
            <span className='text-sm font-medium'>{nav.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // Profile Tab Content
  const ProfileTab = (
    <div className='space-y-4 sm:space-y-6'>
      {/* Profile Header */}
      <div className='bg-white border border-gray-200 p-4 sm:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6'>
          <h2 className='text-xl sm:text-2xl font-bold text-gray-900'>Profile Information</h2>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className='flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap'
          >
            <Edit2 className='w-4 h-4' />
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        {/* Avatar Section */}
        <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200'>
          <div className='relative flex-shrink-0'>
            <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden'>
              {profileData.avatar ? (
                <Image src={profileData.avatar} alt="Profile" width={96} height={96} className='object-cover w-full h-full' />
              ) : (
                <User className='w-10 h-10 sm:w-12 sm:h-12 text-gray-400' />
              )}
            </div>
            {isEditing && (
              <button className='absolute bottom-0 right-0 p-1.5 sm:p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-full'>
                <Camera className='w-3 h-3 sm:w-4 sm:h-4' />
              </button>
            )}
          </div>
          <div className='text-center sm:text-left flex-1 min-w-0'>
            <h3 className='text-lg sm:text-xl font-semibold text-gray-900 truncate'>{profileData.name || 'User Name'}</h3>
            <p className='text-sm sm:text-base text-gray-600 truncate'>{profileData.email}</p>
            <p className='text-xs sm:text-sm text-gray-500 mt-1'>Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
          <div className='sm:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Full Name
            </label>
            <div className='flex items-center gap-2 border border-gray-300 px-3 sm:px-4 py-2 sm:py-3'>
              <User className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0' />
              <input
                type='text'
                name='name'
                value={profileData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className='flex-1 outline-none disabled:bg-transparent text-sm sm:text-base min-w-0'
                placeholder='Enter your name'
              />
            </div>
          </div>

          <div className='sm:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <div className='flex items-center gap-2 border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50'>
              <Mail className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0' />
              <input
                type='email'
                name='email'
                value={profileData.email}
                disabled
                className='flex-1 outline-none bg-transparent text-gray-500 text-sm sm:text-base min-w-0 truncate'
              />
            </div>
            <p className='text-xs text-gray-500 mt-1'>Email cannot be changed</p>
          </div>

          <div className='sm:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Phone Number
            </label>
            <div className='flex items-center gap-2 border border-gray-300 px-3 sm:px-4 py-2 sm:py-3'>
              <Phone className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0' />
              <input
                type='tel'
                name='phone'
                value={profileData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className='flex-1 outline-none disabled:bg-transparent text-sm sm:text-base min-w-0'
                placeholder='Enter phone number'
              />
            </div>
          </div>

          <div className='sm:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Location
            </label>
            <div className='flex items-center gap-2 border border-gray-300 px-3 sm:px-4 py-2 sm:py-3'>
              <MapPin className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0' />
              <input
                type='text'
                name='location'
                value={profileData.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                className='flex-1 outline-none disabled:bg-transparent text-sm sm:text-base min-w-0'
                placeholder='City, Country'
              />
            </div>
          </div>

          <div className='sm:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Bio
            </label>
            <textarea
              name='bio'
              value={profileData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={4}
              className='w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent text-sm sm:text-base resize-none'
              placeholder='Tell us about yourself...'
            />
          </div>
        </div>

        {isEditing && (
          <div className='flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200'>
            <button
              onClick={handleSave}
              className='px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base'
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className='px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base'
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Preference Tab Content
  const PreferenceTab = (
    <div className='space-y-4 sm:space-y-6'>
      <div className='bg-white border border-gray-200 p-4 sm:p-6'>
        <h2 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6'>Preferences</h2>
        
        <div className='space-y-4 sm:space-y-6'>
          {/* Language */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 py-4 border-b border-gray-200'>
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Globe className='w-5 h-5 text-gray-600 flex-shrink-0' />
              <div className='min-w-0 flex-1'>
                <h3 className='font-medium text-gray-900 text-sm sm:text-base'>Language</h3>
                <p className='text-xs sm:text-sm text-gray-600'>Choose your preferred language</p>
              </div>
            </div>
            <select className='border border-gray-300 px-3 sm:px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-full sm:w-auto'>
              <option>English</option>
              <option>বাংলা</option>
            </select>
          </div>

          {/* Notifications */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 py-4 border-b border-gray-200'>
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Bell className='w-5 h-5 text-gray-600 flex-shrink-0' />
              <div className='min-w-0 flex-1'>
                <h3 className='font-medium text-gray-900 text-sm sm:text-base'>Email Notifications</h3>
                <p className='text-xs sm:text-sm text-gray-600'>Receive updates via email</p>
              </div>
            </div>
            <label className='relative inline-block w-12 h-6 flex-shrink-0'>
              <input type='checkbox' className='peer sr-only' defaultChecked />
              <span className='absolute inset-0 bg-gray-300 peer-checked:bg-blue-600 transition-colors cursor-pointer rounded-full'></span>
              <span className='absolute left-1 top-1 w-4 h-4 bg-white transition-transform peer-checked:translate-x-6 rounded-full'></span>
            </label>
          </div>

          {/* Push Notifications */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 py-4'>
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Bell className='w-5 h-5 text-gray-600 flex-shrink-0' />
              <div className='min-w-0 flex-1'>
                <h3 className='font-medium text-gray-900 text-sm sm:text-base'>Push Notifications</h3>
                <p className='text-xs sm:text-sm text-gray-600'>Get notified about important updates</p>
              </div>
            </div>
            <label className='relative inline-block w-12 h-6 flex-shrink-0'>
              <input type='checkbox' className='peer sr-only' />
              <span className='absolute inset-0 bg-gray-300 peer-checked:bg-blue-600 transition-colors cursor-pointer rounded-full'></span>
              <span className='absolute left-1 top-1 w-4 h-4 bg-white transition-transform peer-checked:translate-x-6 rounded-full'></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  // Contributions Tab Content
  const ContributionsTab = (
    <div className='space-y-4 sm:space-y-6'>
      <div className='bg-white border border-gray-200 p-4 sm:p-6'>
        <h2 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6'>Your Contributions</h2>
        
        {/* Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8'>
          <div className='border border-gray-200 p-4'>
            <p className='text-xs sm:text-sm text-gray-600 mb-1'>Total Contributions</p>
            <p className='text-2xl sm:text-3xl font-bold text-gray-900'>0</p>
          </div>
          <div className='border border-gray-200 p-4'>
            <p className='text-xs sm:text-sm text-gray-600 mb-1'>This Month</p>
            <p className='text-2xl sm:text-3xl font-bold text-gray-900'>0</p>
          </div>
          <div className='border border-gray-200 p-4'>
            <p className='text-xs sm:text-sm text-gray-600 mb-1'>Recognition Points</p>
            <p className='text-2xl sm:text-3xl font-bold text-gray-900'>0</p>
          </div>
        </div>

        {/* Empty State */}
        <div className='text-center py-8 sm:py-12'>
          <HandHeart className='w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4' />
          <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-2'>No contributions yet</h3>
          <p className='text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4'>Start contributing to build your profile</p>
          <button className='px-4 sm:px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base'>
            Make Your First Contribution
          </button>
        </div>
      </div>
    </div>
  )

  // Settings Tab Content
  const SettingsTab = (
    <div className='space-y-4 sm:space-y-6'>
      <div className='bg-white border border-gray-200 p-4 sm:p-6'>
        <h2 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6'>Account Settings</h2>
        
        <div className='space-y-4 sm:space-y-6'>
          {/* Security */}
          <div className='pb-4 sm:pb-6 border-b border-gray-200'>
            <div className='flex items-center gap-3 mb-4'>
              <Shield className='w-5 h-5 text-gray-600 flex-shrink-0' />
              <h3 className='text-base sm:text-lg font-semibold text-gray-900'>Security</h3>
            </div>
            <button className='w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base'>
              Change Password
            </button>
          </div>

          {/* Privacy */}
          <div className='pb-4 sm:pb-6 border-b border-gray-200'>
            <div className='flex items-center gap-3 mb-4'>
              <Shield className='w-5 h-5 text-gray-600 flex-shrink-0' />
              <h3 className='text-base sm:text-lg font-semibold text-gray-900'>Privacy</h3>
            </div>
            <div className='space-y-3'>
              <label className='flex items-center gap-3'>
                <input type='checkbox' className='w-4 h-4 flex-shrink-0' defaultChecked />
                <span className='text-sm text-gray-700'>Make profile public</span>
              </label>
              <label className='flex items-center gap-3'>
                <input type='checkbox' className='w-4 h-4 flex-shrink-0' defaultChecked />
                <span className='text-sm text-gray-700'>Show email to other users</span>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <div className='flex items-center gap-3 mb-4'>
              <Trash2 className='w-5 h-5 text-red-600 flex-shrink-0' />
              <h3 className='text-base sm:text-lg font-semibold text-red-900'>Danger Zone</h3>
            </div>
            <p className='text-xs sm:text-sm text-gray-600 mb-4'>Once you delete your account, there is no going back. Please be certain.</p>
            <button className='w-full sm:w-auto px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 transition-colors text-sm sm:text-base'>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return ProfileTab
      case 'preference':
        return PreferenceTab
      case 'contributions':
        return ContributionsTab
      case 'settings':
        return SettingsTab
      default:
        return ProfileTab
    }
  }

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-gray-600'>Loading...</div>
      </div>
    )
  }
  
  return (
    <main className="min-h-screen w-full h-screen bg-gray-50 flex flex-col">
      <Header navlist={NavList} />
      {MobileTabNav}
      <div className="flex">
        {Sidebar}
        <div className='flex-1 p-3 sm:p-6 min-w-0'>
          <div className='max-w-5xl mx-auto w-full'>
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  )
}