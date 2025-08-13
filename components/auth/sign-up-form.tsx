"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Heart } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/lib/auth-actions"

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const result = await signUp(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.success)
    }

    setIsLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Join Our Community</h1>
          <p className="text-gray-600 mt-2">Create your blood bank account to save lives</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Fill in your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <Input id="fullName" name="fullName" type="text" placeholder="John Doe" required className="h-12" />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="h-12" />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567" className="h-12" />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  I am a *
                </label>
                <Select name="role" required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="donor">Blood Donor</SelectItem>
                    <SelectItem value="recipient">Blood Recipient</SelectItem>
                    <SelectItem value="blood_bank">Blood Bank Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">
                  Blood Type
                </label>
                <Select name="bloodType">
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
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
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-red-600 hover:text-red-700 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
