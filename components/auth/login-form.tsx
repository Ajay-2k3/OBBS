"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Heart } from "lucide-react"
import Link from "next/link"
import { signIn } from "@/lib/actions"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(formData)

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Connection failed. Please check your internet connection and try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-red-100 p-3 rounded-full">
            <Heart className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your blood bank account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
                {error.includes("Missing Supabase configuration") && (
                  <div className="mt-2 text-sm">Please set the required environment variables in Project Settings.</div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="h-12" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input id="password" name="password" type="password" required className="h-12" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-red-600 hover:text-red-700 font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
