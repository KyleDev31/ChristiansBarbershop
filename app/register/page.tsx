"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast" 
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { getFirestore } from "firebase/firestore";
import app from "@/lib/firebase"; 
import { Button } from "@/components/ui/button"
import {Tabs, TabsContent } from "@/components/ui/tabs" 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

const db = getFirestore(app);
const registerUser  = async (
  email: string, 
  password: string, 
  fullName: string, 
  phone: string
) => {
  const auth = getAuth(); // this is fine

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      fullName,
      phone,
      createdAt: new Date(),
      role: "customer",
    });
  } catch (err: any) {
    console.error("Firebase registration error:", err);
    if (
      err.code === "auth/email-already-in-use" ||
      err.message?.includes("auth/email-already-in-use")
    ) {
      toast.error("This email is already in use. Please use a different email address.")
    } else {
      toast.error("Registration failed. Please try again.")
    }
    throw err;
  }
};


export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // <-- Add this state

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null); // Reset error on new submit

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const fullName = `${formData.get("first-name")} ${formData.get("last-name")}`;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("new-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      await registerUser(email, password, fullName, phone);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/login");
      }, 5000);
    } catch (error: any) {
      const errorCode = error?.code || '';
      if (errorCode === 'auth/email-already-in-use') {
        setFormError("Email already in use. Please login or use another email.");
      } else if (errorCode === 'auth/invalid-email') {
        setFormError("Please enter a valid email address.");
      } else if (errorCode === 'auth/weak-password') {
        setFormError("Password should be at least 6 characters long.");
      } else {
        setFormError("Registration failed. Please try again.");
        console.error("Registration error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10">
      <div className="w-full max-w-md">
        {showSuccess && (
          <div className="mb-6 p-4 rounded bg-green-100 text-green-800 text-center font-semibold transition-all">
           Registered successfully! Redirecting to login...
          </div>
        )}
        <Tabs defaultValue="register">
          <TabsContent value="register">
            <Card>
              <form onSubmit={handleRegister}>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>Create a new account to book appointments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formError && (
                    <div className="mb-2 flex items-center gap-2 rounded bg-red-100 text-red-700 px-3 py-2 text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input id="first-name" name="first-name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input id="last-name" name="last-name" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="christians@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+63 917 123 4567"
                      pattern="^(\+63|0)9\d{9}$"
                      title="Please enter a valid Philippine cellphone number (e.g., +63 917 123 4567 or 09171234567)"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password</Label>
                    <Input 
                      id="new-password" 
                      name="new-password" 
                      type="password" 
                      required
                      minLength={6}
                      onInput={(e) => {
                        const password = (e.target as HTMLInputElement).value;
                        if (password.length < 6) {
                          (e.target as HTMLInputElement).setCustomValidity("Password must be at least 6 characters long.");
                        } else {
                          (e.target as HTMLInputElement).setCustomValidity("");
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                      minLength={6}
                      onInput={(e) => {
                        const newPassword = (document.getElementById("new-password") as HTMLInputElement)?.value; 
                        const confirmPassword = (e.target as HTMLInputElement)?.value;
                        if (newPassword !== confirmPassword) {
                          (e.target as HTMLInputElement).setCustomValidity("Passwords do not match.");
                        } else {
                          (e.target as HTMLInputElement).setCustomValidity("");
                        }
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button type="submit" className="w-full mb-4" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register"}
                  </Button>
             <p className="text-sm text-center text-muted-foreground">
                Already Have Account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
