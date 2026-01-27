
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        // End of the day for the end date
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
        const [
            totalTrips,
            vehicles,
            tripsByStatus,
            tripsBySection,
            recentTrips, // Used for trend
            allFilteredTrips // Used for aggregated metrics (distance/fuel)
        ] = await Promise.all([
            // 1. Total Trip count
            prisma.trip.count({ where }),

            // 2. Count trips per vehicle (Top 10)
            prisma.trip.groupBy({
                by: ['vehicleId'],
                where,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            }),

            // 3. Status distribution
            prisma.trip.groupBy({
                by: ['status'],
                where,
                _count: { id: true }
            }),

            // 4. Section distribution (approximated by joining later or using where)
            // Note: If we filter by section, this distribution will just be 100% that section, which is expected.
            prisma.trip.findMany({
                where,
                select: {
                    vehicle: { select: { section: true } }
                }
            }),

            // 5. Monthly trend (handled in JS)
            prisma.trip.findMany({
                where,
                select: { departureDate: true },
                orderBy: { departureDate: 'asc' }
            }),

            // 6. Aggregated Metrics (Distance & Fuel)
            prisma.trip.findMany({
                where,
                select: {
                    totalDistance: true,
                    fuelLogs: {
                        select: { liter: true }
                    }
                }
            })
        ])

        // --- Calculate New Metrics ---
        let totalDistance = 0
        let totalFuel = 0

        allFilteredTrips.forEach(trip => {
            if (trip.totalDistance) {
                totalDistance += trip.totalDistance
            }
            if (trip.fuelLogs && trip.fuelLogs.length > 0) {
                trip.fuelLogs.forEach(log => {
                    totalFuel += Number(log.liter)
                })
            }
        })

        // Oil Consumption Rate (km / Liter)
        // Avoid division by zero
        const oilConsumptionRate = totalFuel > 0
            ? (totalDistance / totalFuel).toFixed(2)
            : "0.00"

        // Process Vehicle Names
        const vehicleIds = vehicles.map(v => v.vehicleId)
        const vehicleDetails = await prisma.vehicle.findMany({
            where: { id: { in: vehicleIds } },
            select: { id: true, licensePlate: true }
        })

        const topVehicles = vehicles.map(v => ({
            name: vehicleDetails.find(d => d.id === v.vehicleId)?.licensePlate || `Vehicle #${v.vehicleId}`,
            count: v._count.id
        }))

        // Process Section Distribution
        const sectionCounts: Record<string, number> = {}
        tripsBySection.forEach(t => {
            const sec = t.vehicle?.section || "Unknown"
            sectionCounts[sec] = (sectionCounts[sec] || 0) + 1
        })
        const sectionData = Object.entries(sectionCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // Top 5 sections

        // Process Graph Trend (Daily or Monthly depending on range?) 
        // Keeping it simple: Monthly/Daily buckets based on data
        // If range is small, daily might be better, but let's stick to existing logic or slightly improved.
        // Existing logic was "Monthly". Let's auto-detect: if range < 2 months, do Daily.

        const isShortRange = start && end && (new Date(end).getTime() - new Date(start).getTime() < 60 * 24 * 60 * 60 * 1000)

        const trendCounts: Record<string, number> = {}
        recentTrips.forEach(t => {
            const date = new Date(t.departureDate)
            let key: string
            if (isShortRange) {
                // YYYY-MM-DD
                key = date.toISOString().split('T')[0]
            } else {
                // YYYY-MM
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            }
            trendCounts[key] = (trendCounts[key] || 0) + 1
        })
        const trendData = Object.entries(trendCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))

        // Return JSON
        return NextResponse.json({
            totalTrips,
            topVehicles,
            statusDistribution: tripsByStatus.map(s => ({ status: s.status, count: s._count.id })),
            sectionDistribution: sectionData,
            trendData,
            totalDistance,
            oilConsumptionRate
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
