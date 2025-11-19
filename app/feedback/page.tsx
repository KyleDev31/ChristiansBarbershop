"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import AuthGuard from "@/components/AuthGuard"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, X as XIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const db = getFirestore(app)

export async function submitFeedback(feedback: {
name: string
email: string
rating: number
comment: string
date: string
  category: string
}) {
return addDoc(collection(db, "feedback"), feedback)
}

export default function FeedbackPage() {
const router = useRouter()
const [rating, setRating] = useState(0)
const [isSubmitting, setIsSubmitting] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successCountdown, setSuccessCountdown] = useState(3000)
  const [successProgress, setSuccessProgress] = useState(100)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
const [user, setUser] = useState<any | null>(null)

useEffect(() => {
const auth = getAuth();
const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
if (!firebaseUser) {
        // Show a professional login prompt dialog instead of toast
        setLoginPromptOpen(true)
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
      category: formData.get("category") as string,
date: new Date().toISOString(),
}

try {
await submitFeedback(feedback)
      // open improved success dialog and start countdown
      setSuccessDialogOpen(true)
      setSuccessCountdown(3000)
      setSuccessProgress(100)
} catch (error) {
      console.error(error)
      setErrorMessage("Something went wrong. Please try again.")
      setErrorDialogOpen(true)
} finally {
setIsSubmitting(false)
}
}

  // Auto-close success dialog with progress
  useEffect(() => {
    if (!successDialogOpen) return
    const start = Date.now()
    const total = successCountdown
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(total - elapsed, 0)
      setSuccessProgress(Math.round((remaining / total) * 100))
      if (remaining === 0) {
        clearInterval(interval)
        setSuccessDialogOpen(false)
        router.push("/")
      }
    }, 100)
    return () => clearInterval(interval)
  }, [successDialogOpen, successCountdown, router])

  const handleRetry = () => {
    setErrorDialogOpen(false)
    // focus back to comment textarea
    const el = document.getElementById("comment") as HTMLTextAreaElement | null
    el?.focus()
  }

  const handleLoginNow = () => {
    setLoginPromptOpen(false)
    router.push('/login')
  }

  // add client auth tracking
  // ensure submission/creation checks auth
  const handleSubmitFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    const formData = new FormData(e.currentTarget)
    const feedback = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      rating: rating,
      comment: formData.get("comment") as string,
      category: formData.get("category") as string,
      date: new Date().toISOString(),
    }
  
    if (!user) {
      // prevent anonymous submissions and redirect to login
      toast.error("You must sign in to leave feedback.")
      router.push("/login")
      return
    }
  
    try {
      await submitFeedback(feedback)
      // open improved success dialog and start countdown
      setSuccessDialogOpen(true)
      setSuccessCountdown(3000)
      setSuccessProgress(100)
    } catch (error) {
      console.error(error)
      setErrorMessage("Something went wrong. Please try again.")
      setErrorDialogOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

return (
<AuthGuard>
<div className="flex flex-col min-h-screen">
      {/* Login prompt dialog */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to leave feedback</DialogTitle>
            <DialogDescription>We need your account to associate feedback with your visit.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">Please sign in to submit feedback and help us improve.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLoginPromptOpen(false)}>Maybe later</Button>
              <Button onClick={handleLoginNow}>Sign in</Button>
</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback received</DialogTitle>
            <DialogDescription>Thank you — your feedback has been submitted successfully.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-green-100 text-green-700 rounded-full p-4">
              <Check className="w-8 h-8" />
            </div>
            <div className="w-full mt-2">
              <Progress value={successProgress} />
              <div className="text-xs text-muted-foreground text-right mt-1">Closing in {Math.ceil((successProgress/100)* (successCountdown/1000))}s</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-red-100 text-red-700 rounded-full p-4">
              <XIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold">Submission failed</h3>
            <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>Close</Button>
              <Button onClick={handleRetry}>Retry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

<SiteHeader />
<main className="flex-1">
<div className="container max-w-2xl py-10 justify-center mx-auto">
<Card>
<form onSubmit={handleSubmitFeedback}>
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

                {/* Category selector for targeted feedback */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" name="category" required className="w-full border rounded px-3 py-2">
                    <option value="">Select category</option>
                    <option value="barbershop">Barbershop</option>
                    <option value="barber_service">Barber's Service</option>
                    <option value="system_bug">System bug</option>
                  </select>
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
                            rating === 1 && star === 1
                              ? "fill-red-500 text-red-500"
                              : star <= rating
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
</AuthGuard>
)
}
