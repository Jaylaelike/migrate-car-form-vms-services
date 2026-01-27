"use client"

import { useRouter } from "next/navigation"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, User } from "lucide-react"
import { formatDateThai } from "@/lib/format-utils"
import { getApiPath } from "@/lib/utils"

interface TripRowProps {
    trip: {
        id: number
        departureDate: Date
        origin: string | null
        destination: string | null
        totalDistance: number | null
        status: string
        driver: {
            ThaiName: string | null
            EngName: string | null
            email: string | null
            image_url: string | null
        } | null
    }
}

export function TripRow({ trip }: TripRowProps) {
    const router = useRouter()

    return (
        <TableRow
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            onClick={() => router.push(`/trips/${trip.id}`)}
        >
            <TableCell className="font-medium whitespace-nowrap">
                {formatDateThai(trip.departureDate)}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {trip.driver?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getApiPath(trip.driver.image_url)} alt="Driver" className="h-6 w-6 rounded-full object-cover border border-slate-200" />
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] items-center justify-center text-slate-500">
                            <User className="h-3 w-3" />
                        </div>
                    )}
                    <span className="text-sm font-medium">{trip.driver?.ThaiName || trip.driver?.EngName || "-"}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col text-sm">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <span className="text-green-500 text-xs">●</span> {trip.origin}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <span className="text-red-500 text-xs">●</span> {trip.destination}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                {trip.totalDistance ? trip.totalDistance.toLocaleString() : "-"}
            </TableCell>
            <TableCell>
                <Badge variant={trip.status === "COMPLETED" ? "outline" : "default"} className={trip.status === "ONGOING" ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" : ""}>
                    {trip.status === "ONGOING" ? "กำลังดำเนินงาน" : "เสร็จสิ้น"}
                </Badge>
            </TableCell>
            <TableCell>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                </Button>
            </TableCell>
        </TableRow>
    )
}
