"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Scissors, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setEmailSent(true)
      toast.success("Password reset email sent! Check your inbox.")
    } catch (error: any) {
      console.error("Password reset error:", error)
      
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.")
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.")
      } else {
        setError("Failed to send reset email. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <Scissors className="h-12 w-12 mb-2" />
            <h1 className="text-3xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground">We've sent you a password reset link</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle>Email Sent!</CardTitle>
              <CardDescription>
                We've sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Check your email inbox (and spam folder)</p>
                <p>• Click the link in the email to reset your password</p>
                <p>• The link will expire in 1 hour</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => {
                    setEmailSent(false)
                    setEmail("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
                <Button 
                  onClick={() => router.push("/login")}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Scissors className="h-12 w-12 mb-2" />
          <h1 className="text-3xl font-bold">Forgot Password?</h1>
          <p className="text-muted-foreground">Enter your email to reset your password</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardContent className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Email"}
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.push("/login")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}

