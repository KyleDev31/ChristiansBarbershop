import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function ServicesLoading() {
  return (
    <div className="container py-10">
      <div className="text-center mb-10">
        <Skeleton className="h-10 w-[300px] mx-auto mb-2" />
        <Skeleton className="h-6 w-[500px] mx-auto" />
      </div>

      <div className="flex justify-center mb-8">
        <Skeleton className="h-10 w-full max-w-2xl" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
      </div>

      <div className="mt-16 text-center">
        <Skeleton className="h-8 w-[250px] mx-auto mb-4" />
        <Skeleton className="h-6 w-[500px] mx-auto mb-6" />
        <Skeleton className="h-12 w-[200px] mx-auto" />
      </div>
    </div>
  )
}

function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-[200px] w-full" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-6 w-[60px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}
