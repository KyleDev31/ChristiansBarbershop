"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import AuthGuard from "@/components/AuthGuard"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

/**
 * Feedback page (cleaned)
 * - Guards with AuthGuard (also does a quick auth redirect fallback)
 * - Renders a simple feedback form placeholder
 */

export default function FeedbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login")
      } else {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Leave Feedback</h1>
            <p className="text-sm text-gray-600 mb-6">
              Share your experience at Christian&apos;s Barbershop — your feedback helps us improve.
            </p>

            <form
              className="bg-white rounded-lg shadow p-6"
              onSubmit={(e) => {
                e.preventDefault()
                // TODO: implement submit logic
                alert("Thank you — feedback submitted (placeholder).")
                ;(e.target as HTMLFormElement).reset()
              }}
            >
              <label className="block mb-4">
                <span className="text-sm font-medium">Name</span>
                <input
                  name="name"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  placeholder="Your name"
                />
              </label>

              <label className="block mb-4">
                <span className="text-sm font-medium">Email</span>
                <input
                  name="email"
                  type="email"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block mb-4">
                <span className="text-sm font-medium">Comment</span>
                <textarea
                  name="comment"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  rows={5}
                  placeholder="Tell us about your visit..."
                />
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </main>
        <SiteFooter />
      </div>
    </AuthGuard>
  )
}
