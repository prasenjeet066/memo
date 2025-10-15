"use client"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { z } from "zod"

const stepSchemas = [
  // Step 0: Personal Info
  z.object({
    fullName: z.string().min(2, "Full name is required"),
    dob: z.string().min(1, "Date of birth is required"),
  }),
  // Step 1: Account Info
  z.object({
    email: z.string().email("Enter a valid email"),
    username: z.string().min(3, "Username must be at least 3 characters"),
  }),
  // Step 2: Passwords
  z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  }).refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
]

const initialForm = {
  fullName: "",
  dob: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState("")
  const [success, setSuccess] = useState("")

  function validateCurrentStep() {
    const schema = stepSchemas[step]
    const result = schema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[String(e.path[0])] = e.message
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!validateCurrentStep()) return
    setStep(s => s + 1)
  }

  function handleBack() {
    setErrors({})
    setStep(s => s - 1)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors({})
    setServerError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateCurrentStep()) return

    setIsLoading(true)
    setServerError("")
    setSuccess("")

    const { email, password, username, fullName, dob } = form
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, fullName, dob }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess("Registration successful! Check your email to verify your account.")
        setTimeout(() => router.push("/login"), 2500)
      } else {
        setServerError(data.error || "Registration failed")
      }
    } catch (error) {
      setServerError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1">
              <h1 className="logo-style-font text-2xl font-semibold text-gray-800 cursor-pointer">
                memo
              </h1>
            </Link>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors px-4 py-2"
          >
            Login
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600">
            {step === 0 && "Let's start with your personal details"}
            {step === 1 && "Set up your account information"}
            {step === 2 && "Secure your account with a password"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step + 1} of 3</span>
            <span className="text-sm text-gray-500">{Math.round(((step + 1) / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gray-800 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {serverError}
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Multi-step Form */}
        <form
          onSubmit={step === 2 ? handleSubmit : handleNext}
          className="space-y-6 px-4"
        >
          {step === 0 && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-full"
                  disabled={isLoading}
                  autoComplete="name"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-red-600 text-xs mt-2 ml-4">{errors.fullName}</p>
                )}
              </div>
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-900 mb-2">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-full"
                  disabled={isLoading}
                />
                {errors.dob && (
                  <p className="text-red-600 text-xs mt-2 ml-4">{errors.dob}</p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-full"
                  disabled={isLoading}
                  autoComplete="email"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-2 ml-4">{errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-full"
                  disabled={isLoading}
                  autoComplete="username"
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="text-red-600 text-xs mt-2 ml-4">{errors.username}</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white rounded-full"
                    disabled={isLoading}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 transition-colors rounded-full"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-xs mt-2 ml-4">{errors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white rounded-full"
                    disabled={isLoading}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 transition-colors rounded-full"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-2 ml-4">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 text-gray-800 font-medium"
                disabled={isLoading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`${step > 0 ? 'flex-1' : 'w-full'} bg-gray-800 text-white rounded-full py-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors`}
            >
              {isLoading
                ? step === 2 ? "Please Wait" : "Processing..."
                : step === 2 ? "Create Account" : "Continue"
              }
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Terms
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/help" className="hover:text-gray-700 transition-colors">
              Help
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}