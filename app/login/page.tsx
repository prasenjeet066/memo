// ===== FIXED: app/login/page.tsx =====
"use client"
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [passwordType, setPasswordType] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  
  const handleChange = (e: React.ChangeEvent < HTMLInputElement > ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const { usernameOrEmail, password } = formData
    
    if (!usernameOrEmail || !password) {
      setError('Please fill in all fields.')
      setIsLoading(false)
      return
    }
    
    try {
      const result = await signIn('credentials', {
        usernameOrEmail,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setError('Invalid credentials. Please try again.')
      } else {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Login</h1>
        </div>
      </header>

      {/* Form Container */}
      <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-70px)]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                শুভেচ্ছা আপনাকে!
              </h2>
              <p className="text-sm text-gray-600">Sign in to your account</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username or Email */}
              <div>
                <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email address
                </label>
                <input
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  type="text"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                  disabled={isLoading}
                  placeholder="Enter your username or email"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={passwordType ? 'password' : 'text'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                    disabled={isLoading}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordType(!passwordType)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {passwordType ? (
                      <Eye className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Please Wait...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="mx-4 text-gray-500 text-sm font-medium">OR</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full border border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}