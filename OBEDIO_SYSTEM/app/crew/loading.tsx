import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Filter, LayoutGrid, Search, UsersIcon } from "lucide-react"

export default function CrewLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[200px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 mb-4">
              <div className="flex bg-muted rounded-md p-1">
                <div className="px-3 py-2 rounded-sm flex items-center gap-1 bg-background">
                  <LayoutGrid className="h-4 w-4" />
                  <span>Crew Cards</span>
                </div>
                <div className="px-3 py-2 rounded-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Duty Calendar</span>
                </div>
                <div className="px-3 py-2 rounded-sm flex items-center gap-1">
                  <UsersIcon className="h-4 w-4" />
                  <span>Groups</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-[140px] h-10 border rounded-md px-3 py-2 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="relative w-[200px]">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Skeleton className="h-10 w-[200px]" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-10" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[120px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                      <Skeleton className="h-6 w-[70px] rounded-full" />
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[50px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
