"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scissors } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import AuthGuard from "@/components/AuthGuard"

interface Haircut {
  id: number
  name: string
  description: string
  image: string
}

export default function HaircutRecommendationsPage() {
  const [selectedFaceShape, setSelectedFaceShape] = useState("oval")

  const faceShapes = [
    {
      id: "oval",
      name: "Oval",
      description: "Balanced proportions with a slightly wider forehead than chin and soft jawline.",
      image: "/oval.jpg?height=200&width=150",
    },
    {
      id: "round",
      name: "Round",
      description: "Similar width and length with soft features and rounded jawline.",
      image: "/round.jpg?height=200&width=150",
    },
    {
      id: "square",
      name: "Square",
      description: "Strong jawline with a square chin and broad forehead.",
      image: "/square.jpg?height=200&width=150",
    },
    {
      id: "heart",
      name: "Heart",
      description: "Wider forehead and cheekbones with a narrow chin.",
      image: "/heart.jpg?height=200&width=150",
    },
    {
      id: "diamond",
      name: "Diamond",
      description: "Narrow forehead and jawline with wide cheekbones.",
      image: "/diamond.jpg?height=200&width=150",
    },
    {
      id: "oblong",
      name: "Oblong",
      description: "Face length is longer than width with a long straight cheek line.",
      image: "/oblong.jpg?height=200&width=150",
    },
  ]

  const haircutRecommendations = {
    oval: [
      {
        id: 1,
        name: "Classic Pompadour",
        description: "A timeless style with short sides and volume on top that suits oval faces perfectly.",
        image: "/reco-oval3.jpg?height=300&width=300",
      },
      {
        id: 2,
        name: "Textured Crop",
        description: "A modern cut with textured top and faded sides that enhances oval face proportions.",
        image: "/reco-oval2.jpg?height=300&width=300",
      },
      {
        id: 3,
        name: "Side Part",
        description: "A versatile and professional style that works well with oval face shapes.",
        image: "/reco-oval.jpg?height=300&width=300",
      },
    ],
    round: [
      {
        id: 1,
        name: "Pompadour with Fade",
        description: "Adds height and angles to balance roundness with short sides for definition.",
        image: "/round-rec1.jpg?height=300&width=300",
      },
      {
        id: 2,
        name: "Undercut",
        description: "Creates angles and definition with longer top and very short sides.",
        image: "/round-rec2.jpg?height=300&width=300",
      },
      {
        id: 3,
        name: "Quiff with Taper",
        description: "Adds height and structure to elongate a round face shape.",
        image: "/round-rec3.jpg?height=300&width=300",
      },
    ],
    square: [
      {
        id: 1,
        name: "Textured Fringe",
        description: "Softens strong jawlines with texture and movement on top.",
        image: "/square-rec1.jpg?height=300&width=300",
      },
      {
        id: 2,
        name: "Brush Up",
        description: "Adds height while maintaining the strong features of a square face.",
        image: "/square-rec2.jpg?height=300&width=300",
      },
      {
        id: 3,
        name: "Layered Cut",
        description: "Softens angles with layers while maintaining a masculine look.",
        image: "/square-rec3.jpg?height=300&width=300",
      },
    ],
    heart: [
      {
        id: 1,
        name: "Mid-Length Textured",
        description: "Adds width to the lower part of the face to balance a wider forehead.",
        image: "/heart-rec1.jpg?height=300&width=300",
      },
      {
        id: 2,
        name: "Side-Swept Fringe",
        description: "Minimizes forehead width while adding balance to the face shape.",
        image: "/heart-rec2.jpg?height=300&width=300",
      },
      {
        id: 3,
        name: "Medium Crop",
        description: "Creates balance with textured sides that add width to the jawline.",
        image: "/heart-rec3.jpg?height=300&width=300",
      },
    ],
    diamond: [
      {
        id: 1,
        name: "Textured Fringe",
        description: "Adds width to the forehead while softening the cheekbones.",
        image: "/diamond-rec1.jpg?height=300&width=300",
      },
      {
        id: 2,
        name: "Classic Taper",
        description: "Balances the narrow forehead and jawline with clean tapered sides.",
        image: "/diamond-rec2.jpg?height=300&width=300",
      },
      {
        id: 3,
        name: "Layered Mid-Length",
        description: "Adds volume at the temples and jawline to balance wide cheekbones.",
        image: "/diamond-rec3.jpg?height=300&width=300",
      },
    ],
    oblong: [
      {
        id: 1,
        name: "Textured Crop with Fringe",
        description: "Shortens the face by adding a fringe while maintaining volume on the sides.",
        image: "/oblong-rec1.jpg?height=300&width=300",
      },
      {
        id: 2,
        name: "Side Part with Volume",
        description: "Adds width to the sides to balance the length of the face.",
        image: "/oblong-rec2.jpg?height=300&width=300",
      },
      {
        id: 3,
        name: "Slick Back with Texture",
        description: "Creates the illusion of a shorter face with volume on the sides.",
        image: "/oblong-rec3.jpg?height=300&width=300",
      },
    ],
  }

  return (
    <AuthGuard>
      <>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sticky top-0 z-50 bg-white bg-opacity-30 backdrop-blur-md rounded-lg mb-6 py-2">
            <SiteHeader />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Scissors className="h-6 w-6" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Haircut Recommendations</h1>
          </div>

          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-3xl">
            Finding the perfect haircut starts with understanding your face shape. Select your face shape below to see our
            personalized recommendations that will enhance your features and style.
          </p>

          <Tabs defaultValue="oval" value={selectedFaceShape} onValueChange={setSelectedFaceShape} className="mb-6 sm:mb-8">
            {/* Make tabs scrollable on small screens */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 mb-4">
              <TabsList className="inline-flex gap-2 px-4 sm:px-0">
                {faceShapes.map((shape) => (
                  <TabsTrigger key={shape.id} value={shape.id} className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2 rounded-md">
                    {shape.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {faceShapes.map((shape) => (
              <TabsContent key={shape.id} value={shape.id} className="mt-4">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="md:w-1/3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">{shape.name} Face Shape</CardTitle>
                        <CardDescription className="text-sm sm:text-base">{shape.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <div className="relative w-40 h-48 sm:w-44 sm:h-56">
                          <Image
                            src={shape.image || "/placeholder.svg"}
                            alt={`${shape.name} face shape`}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <p className="text-sm text-muted-foreground">
                          The best haircuts for {shape.name.toLowerCase()} face shapes add balance and enhance your natural
                          features.
                        </p>
                      </CardFooter>
                    </Card>
                  </div>

                  <div className="md:w-2/3">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Recommended Haircuts</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {haircutRecommendations[shape.id as keyof typeof haircutRecommendations].map((haircut: Haircut) => (
                        <Card key={haircut.id} className="overflow-hidden">
                          <div className="aspect-square relative">
                            <Image
                              src={haircut.image || "/placeholder.svg"}
                              alt={haircut.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-medium text-base sm:text-lg">{haircut.name}</h3>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{haircut.description}</p>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <div className="w-full">
                            
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Full width footer */}
        <div className="w-full bg-white">
          <SiteFooter />
        </div>
      </>
    </AuthGuard>
  )
}
