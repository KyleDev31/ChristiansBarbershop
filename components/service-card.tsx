import { Clock } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ServiceCardProps {
  service: {
    id: number
    name: string
    price: number
    image: string
  }
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img src={service.image || "/placeholder.svg"} alt={service.name} className="object-cover w-full h-full" />
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-lg">{service.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <p className="font-bold text-lg">₱{service.price}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/book?service=${service.id}`}>Book Now</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
