"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Scissors, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { createAdminAccount } from "@/lib/admin"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminRegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Check if admin exists
      const q = query(collection(db, "users"), where("role", "==", "admin"))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        setError("Admin account already exists. Please contact an existing administrator.")
        setIsLoading(false)
        return
      }

      const result = await createAdminAccount(email, password, fullName, phone)
      if (result.success) {
        toast.success("Admin account created successfully")
        router.push("/admin/dashboard")
      } else {
        setError(result.error || "Failed to create admin account")
      }
    } catch (error: any) {
      setError(error.message || "Failed to create admin account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10 flex justify-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Scissors className="h-12 w-12 mb-2" />
          <h1 className="text-3xl font-bold">Create Admin Account</h1>
          <p className="text-muted-foreground">Register the first administrator account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Admin Registration</CardTitle>
              <CardDescription>Enter details for the new admin account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Admin Account"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 