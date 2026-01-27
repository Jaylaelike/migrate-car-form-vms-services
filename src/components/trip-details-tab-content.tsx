"use client"

import { useEffect, useState } from "react"
import { getTripDetails } from "@/app/actions/trip-actions"
import { TripInfoDisplay } from "./trip-info-display"
import { Loader2 } from "lucide-react"

interface TripDetailsTabContentProps {
    tripId: number
}

// We need to define the type for the trip data that TripInfoDisplay expects.
// Since getTripDetails returns the correct type (or null), we can infer or simpler just use 'any' if lazy, but let's be safe.
// effectively it returns Promise<TripWithDetails | null>

export function TripDetailsTabContent({ tripId }: TripDetailsTabContentProps) {
    const [trip, setTrip] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchTrip = () => {
        setLoading(true)
        getTripDetails(tripId)
            .then((data) => {
                setTrip(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchTrip()
    }, [tripId])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
        )
    }

    if (!trip) {
        return (
            <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg border border-red-100 dark:bg-red-950/20 dark:border-red-900/50">
                <p>ไม่พบข้อมูลการเดินทาง</p>
            </div>
        )
    }

    return (
        <div className="max-h-[60vh] overflow-y-auto pr-2">
            <TripInfoDisplay trip={trip} onRefresh={fetchTrip} />
        </div>
    )
}
