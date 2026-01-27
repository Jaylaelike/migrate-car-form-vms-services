
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const section = searchParams.get('section')

    // Build Date Filter
    const dateFilter: any = {}
    if (start) {
        dateFilter.gte = new Date(start)
    }
    if (end) {
        const endDate = new Date(end)
        endDate.setHours(23, 59, 59, 999)
        dateFilter.lte = endDate
    }

    // Build Where Clause
    const where: any = {}
    if (Object.keys(dateFilter).length > 0) {
        where.departureDate = dateFilter
    }
    if (section && section !== "all") {
        where.vehicle = {
            section: section
        }
    }

    try {
        // Fetch Trips with all details needed for CSV
        const trips = await prisma.trip.findMany({
            where,
            include: {
                vehicle: true,
                driver: true,
                fuelLogs: true
            },
            orderBy: { departureDate: 'desc' }
        })

        // Generate CSV Header
        const header = [
            "Trip ID",
            "Vehicle License",
            "Section",
            "Driver",
            "Departure Date",
            "Return Date",
            "Origin",
            "Destination",
            "Total Distance (km)",
            "Fuel Liters",
            "Fuel Cost",
            "Status"
        ].join(",")

        // Generate CSV Rows
        const rows = trips.map(trip => {
            const license = trip.vehicle.licensePlate
            const sec = trip.vehicle.section || "-"
            // driver might be linked user or just text if we had loose coupling, 
            // schema says driver: User?
            const driverName = trip.driver?.username || trip.driverId || "-" // Fallback

            const depDate = new Date(trip.departureDate).toISOString().split('T')[0]
            const retDate = trip.returnDate ? new Date(trip.returnDate).toISOString().split('T')[0] : "-"

            const origin = `"${(trip.origin || "").replace(/"/g, '""')}"`
            const dest = `"${(trip.destination || "").replace(/"/g, '""')}"`

            const distance = trip.totalDistance || 0

            // Sum up fuel logs
            let fuelLiters = 0
            let fuelCost = 0
            if (trip.fuelLogs && trip.fuelLogs.length > 0) {
                trip.fuelLogs.forEach(log => {
                    fuelLiters += Number(log.liter)
                    fuelCost += Number(log.price)
                })
            }

            const status = trip.status

            return [
                trip.id,
                license,
                sec,
                driverName,
                depDate,
                retDate,
                origin,
                dest,
                distance,
                fuelLiters.toFixed(2),
                fuelCost.toFixed(2),
                status
            ].join(",")
        })

        const csvContent = [header, ...rows].join("\n")

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="analytics_export_${new Date().toISOString().split('T')[0]}.csv"`
            }
        })

    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 })
    }
}
