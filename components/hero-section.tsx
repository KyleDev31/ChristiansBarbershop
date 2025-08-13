"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HeroSection() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login")
    }
  }, [isLoading, isLoggedIn, router])

  if (isLoading) return null

  return (
    <div className="relative bg-black text-white">
      <div
        className="absolute inset-0 bg-black/60 z-10"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(61, 61, 61, 0.7), rgba(0,0,0,0.2))",
        }}
      ></div>
      <div className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4">
          <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden">
            <img
              src="/bslogo.jpg?height=600&width=800"
              alt="Barbershop interior"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <img
              src="/ent.jpg?height=300&width=400"
              alt="Barber at work"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <img
              src="/barber.jpg?height=300&width=400"
              alt="Haircut detail"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent z-10"></div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 hover:italic">Christian's Barbershop</h1>
          <p className="text-xl md:text-2xl mb-6 max-w-xl">
            Premium haircuts and grooming services in Nabunturan, Davao de Oro
          </p>
          <p className="text-md md:text-lg mb-6 flex items-center text-yellow-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Open 8am to 5pm, Monday to Saturday
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto hover:bg-yellow-600">
              <Link href="/booking">Book Appointment</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white text-black hover:bg-yellow-100"
            >
              <Link href="/queue">Check Queue Status</Link>
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <a
              href="https://web.facebook.com/ChristianBarbershopNabs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-blue-800 p-2 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              <span className="sr-only">Facebook</span>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-yellow-700 p-2 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span className="sr-only">Instagram</span>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-red-800 p-2 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
                <path d="M15 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
                <path d="M15 8v8a4 4 0 0 1-4 4"></path>
                <line x1="15" y1="4" x2="15" y2="12"></line>
              </svg>
              <span className="sr-only">TikTok</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
