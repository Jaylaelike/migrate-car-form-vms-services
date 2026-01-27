
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDateThai } from "@/lib/format-utils"

import { TripInfoDisplay } from "@/components/trip-info-display"
import { EditTripDialog } from "@/components/edit-trip-dialog"
import { DeleteTripAlert } from "@/components/delete-trip-alert"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function TripDetailPage({ params }: PageProps) {
    const session = await auth()
    if (!session) redirect("/login")

    const resolvedParams = await params
    const tripId = parseInt(resolvedParams.id)
    if (isNaN(tripId)) notFound()

    const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
            vehicle: true,
            driver: true,
            fuelLogs: {
                orderBy: { createdAt: "asc" }
            }
        }
    })

    if (!trip) notFound()

    // Restrict access based on section if needed (same logic as vehicle)
    if (session.user?.section && trip.vehicle.section && session.user.section !== trip.vehicle.section) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
                    <p className="text-slate-500 mt-2">คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้</p>
                    <Link href="/">
                        <Button className="mt-4" variant="outline">กลับสู่หน้าหลัก</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const duration = trip.returnDate
        ? Math.abs(new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / 36e5
        : null

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/vehicles/${trip.vehicleId}`}>
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                Trip #{trip.id}
                                <Badge variant={trip.status === "COMPLETED" ? "outline" : "default"} className={trip.status === "ONGOING" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}>
                                    {trip.status === "ONGOING" ? "กำลังดำเนินการ" : "เสร็จสิ้น"}
                                </Badge>
                            </h1>
                            <p className="text-slate-500 text-sm">
                                {formatDateThai(trip.departureDate)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <EditTripDialog trip={trip} />
                        <DeleteTripAlert tripId={trip.id} />
                    </div>
                </div>

                <TripInfoDisplay trip={{
                    ...trip,
                    fuelLogs: trip.fuelLogs.map(log => ({
                        ...log,
                        liter: Number(log.liter),
                        price: Number(log.price)
                    }))
                } as any} />
            </div>
        </div>
    )
}
