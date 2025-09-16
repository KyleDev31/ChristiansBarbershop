"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Scissors, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [email, setEmail] = useState("")
  const [passwordReset, setPasswordReset] = useState(false)

  const oobCode = searchParams.get('oobCode')

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or missing reset token. Please request a new password reset.")
      return
    }

    // Verify the password reset code
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email)
        setIsValidToken(true)
      })
      .catch((error) => {
        console.error("Invalid reset code:", error)
        if (error.code === "auth/invalid-action-code") {
          setError("This password reset link is invalid or has expired. Please request a new one.")
        } else if (error.code === "auth/expired-action-code") {
          setError("This password reset link has expired. Please request a new one.")
        } else {
          setError("Invalid password reset link. Please request a new one.")
        }
      })
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!oobCode) {
      setError("Invalid reset token.")
      return
    }

    setIsLoading(true)

    try {
      await confirmPasswordReset(auth, oobCode, password)
      setPasswordReset(true)
      toast.success("Password reset successfully!")
    } catch (error: any) {
      console.error("Password reset error:", error)
      
      if (error.code === "auth/invalid-action-code") {
        setError("This password reset link is invalid or has expired.")
      } else if (error.code === "auth/expired-action-code") {
        setError("This password reset link has expired.")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.")
      } else {
        setError("Failed to reset password. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <Scissors className="h-12 w-12 mb-2" />
            <h1 className="text-3xl font-bold">Password Reset!</h1>
            <p className="text-muted-foreground">Your password has been successfully updated</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle>Success!</CardTitle>
              <CardDescription>
                Your password has been reset successfully. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValidToken && error) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <Scissors className="h-12 w-12 mb-2" />
            <h1 className="text-3xl font-bold">Invalid Link</h1>
            <p className="text-muted-foreground">This password reset link is not valid</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reset Link Invalid</CardTitle>
              <CardDescription>
                The password reset link you clicked is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => router.push("/forgot-password")}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>
                <Button 
                  onClick={() => router.push("/login")}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <Scissors className="h-12 w-12 mb-2" />
            <h1 className="text-3xl font-bold">Verifying...</h1>
            <p className="text-muted-foreground">Please wait while we verify your reset link</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Scissors className="h-12 w-12 mb-2" />
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">Enter your new password</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Enter a new password for <strong>{email}</strong>
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
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardContent className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Back to Login
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
