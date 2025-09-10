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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    setError('') // Clear error when user starts typing
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
        // Successful login - redirect to dashboard or home
        const session = await getSession()
        if (session) {
          router.push('/dashboard') // or wherever you want to redirect
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
      setIsLoading(false)
    }
  }
  
  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={() => router.back()} />
          <h1 className="font-semibold text-gray-900">Sign In</h1>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg  p-6">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Welcome Back
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username or Email */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="usernameOrEmail" className="text-sm font-medium text-gray-700">
                  Email or Username
                </label>
                <input
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  type="text"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <input
                    id="password"
                    name="password"
                    type={passwordType ? 'password' : 'text'}
                    value={formData.password}
                    onChange={handleChange}
                    className="flex-1 focus:outline-none"
                    required
                    disabled={isLoading}
                  />
                  {passwordType ? (
                    <Eye
                      className="w-4 h-4 text-gray-500 cursor-pointer"
                      onClick={() => setPasswordType(false)}
                    />
                  ) : (
                    <EyeOff
                      className="w-4 h-4 text-gray-500 cursor-pointer"
                      onClick={() => setPasswordType(true)}
                    />
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="mx-4 text-gray-500 text-sm">OR</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full border border-gray-300 bg-white text-gray-700 py-2 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
