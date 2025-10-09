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
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Create Account</h1>
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration: Step {step + 1} of 3
          </h2>
          <p className="text-gray-600">
            {step === 0 && "Your personal details"}
            {step === 1 && "Account information"}
            {step === 2 && "Set your password"}
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {serverError}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Multi-step Form */}
        <form
          onSubmit={step === 2 ? handleSubmit : handleNext}
          className="space-y-6 px-2"
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
                  className={`w-full px-4 py-3 border ${errors.fullName ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  disabled={isLoading}
                  autoComplete="name"
                  
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>
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
                  className={`w-full px-4 py-3 border ${errors.dob ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  disabled={isLoading}
                  
                />
                {errors.dob && (
                  <p className="text-red-600 text-xs mt-1">{errors.dob}</p>
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
                  className={`w-full px-4 py-3 border ${errors.email ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  disabled={isLoading}
                  autoComplete="email"
                  
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email}</p>
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
                  className={`w-full px-4 py-3 border ${errors.username ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  disabled={isLoading}
                  autoComplete="username"
                  
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="text-red-600 text-xs mt-1">{errors.username}</p>
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
                    className={`w-full px-4 py-3 pr-12 border ${errors.password ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    disabled={isLoading}
                    required
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 transition-colors"
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
                  <p className="text-red-600 text-xs mt-1">{errors.password}</p>
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
                    className={`w-full px-4 py-3 pr-12 border ${errors.confirmPassword ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    disabled={isLoading}
                    required
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 transition-colors"
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
                  <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={isLoading}
              >
                Back
              </button>
            ) : <span />}
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-md bg-blue-600 text-white font-semibold transition-colors hover:bg-blue-700 disabled:opacity-50`}
            >
              {isLoading
                ? step === 2 ? "Creating Account..." : "Next..."
                : step === 2 ? "Sign Up" : "Next"
              }
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Login
          </Link>
        </div>

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