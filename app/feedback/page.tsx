"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { addDoc, collection } from "firebase/firestore"
import { getFirestore } from "firebase/firestore"
import app from "../../lib/firebase"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const db = getFirestore(app)

export async function submitFeedback(feedback: {
  name: string
  email: string
  rating: number
  comment: string
  date: string
}) {
  return addDoc(collection(db, "feedback"), feedback)
}

export default function FeedbackPage() {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        toast.error("You must be logged in to leave feedback.");
        router.push("/login");
      } else {
        setUser(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const feedback = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      rating: rating,
      comment: formData.get("comment") as string,
      date: new Date().toISOString(),
    }

    try {
      await submitFeedback(feedback)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        router.push("/")
      }, 3000)
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
        {showSuccess && (
            <div className="mb-6 p-4 rounded bg-green-100 text-green-800 text-center font-semibold transition-all">
              Feedback submitted successfully!
            </div>
          )}
      <SiteHeader />
      <main className="flex-1">
        <div className="container max-w-2xl py-10 justify-center mx-auto">
        
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Leave Feedback</CardTitle>
                <CardDescription>
                  Share your experience at Christian's Barbershop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  value={user?.email || ''}
                  readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-0 hover:scale-110 transition-transform"
                        onClick={() => setRating(star)}
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comments</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    placeholder="Tell us about your experience..."
                    required
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || rating === 0}
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}