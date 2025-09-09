"use client"
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const [passwordType, setPasswordType] = useState(true)
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    const { usernameOrEmail, password } = formData
    
    if (!usernameOrEmail || !password) {
      alert('Please fill in all fields.')
      return
    }
    
    // 🔐 Handle actual login logic here
    console.log('Logging in with:', formData)
  }
  
  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <h1 className="font-semibold">Authorization</h1>
        </div>
        <div>{/* Optional right-side header icons */}</div>
      </div>

      {/* Form Container */}
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full space-y-6 bg-white p-6  "
        >
          {/* Username or Email */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="usernameOrEmail" className="text-sm font-medium">
              Email or Username
            </label>
            <input
              id="usernameOrEmail"
              name="usernameOrEmail"
              type="text"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="flex items-center border rounded-md px-3 py-2">
              <input
                id="password"
                name="password"
                type={passwordType ? 'password' : 'text'}
                value={formData.password}
                onChange={handleChange}
                className="flex-1 focus:outline-none"
                required
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
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  )
}