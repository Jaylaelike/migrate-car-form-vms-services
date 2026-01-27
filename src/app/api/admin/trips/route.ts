
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// GET with Pagination
export async function GET(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "USER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const isExport = searchParams.get("export") === "csv"
    const section = searchParams.get("section")
    const vehicleId = searchParams.get("vehicleId")

    // Calculate skip/take only if NOT exporting
    const skip = isExport ? undefined : (page - 1) * limit
    const take = isExport ? undefined : limit

    const where: any = {}
    if (startDate && endDate) {
        where.departureDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        }
    }

    if (section && section !== "all") {
        where.OR = [
            { vehicle: { section: section } },
            { driver: { Section: section } }
        ]
    }

    if (vehicleId) {
        where.vehicleId = parseInt(vehicleId)
    }

    const [trips, total] = await Promise.all([
        prisma.trip.findMany({
            where,
            orderBy: { id: "desc" },
            include: {
                vehicle: true,
                driver: true,
                fuelLogs: true
            },
            skip,
            take
        }),
        prisma.trip.count({ where })
    ])

    if (isExport) {
        const csvHeader = ["ID", "License Plate", "Brand", "Model", "Driver", "Origin", "Destination", "Departure", "Return", "Start Mileage", "End Mileage", "Status", "Total Fuel Price", "Total Fuel Liters", "Fuel Stations", "Fuel Locations"].join(",")
        const csvRows = trips.map(trip => {
            const driverName = trip.driver ? (trip.driver.ThaiName || trip.driver.username) : "Unknown"
            const returnDate = trip.returnDate ? trip.returnDate.toISOString() : ""
            const endMileage = trip.mileageEnd?.toString() || ""

            // Calculate Fuel Summaries
            // @ts-ignore - fuelLogs is included but Typescript might not pick it up without restart or explicit type
            const logs = trip.fuelLogs || []
            const fuelPrice = logs.reduce((acc: number, log: any) => acc + Number(log.price), 0)
            const fuelLiter = logs.reduce((acc: number, log: any) => acc + Number(log.liter), 0)
            const stations = logs.map((log: any) => log.station).filter((s: any) => s).join(" | ")
            const locations = logs.map((log: any) => log.location).filter((l: any) => l).join(" | ")

            return [
                trip.id,
                `"${trip.vehicle.licensePlate}"`,
                `"${trip.vehicle.brand}"`,
                `"${trip.vehicle.model}"`,
                `"${driverName}"`,
                `"${trip.origin}"`,
                `"${trip.destination}"`,
                trip.departureDate.toISOString(),
                returnDate,
                trip.mileageStart,
                endMileage,
                trip.status,
                fuelPrice.toFixed(2),
                fuelLiter.toFixed(3),
                `"${stations}"`,
                `"${locations}"`
            ].join(",")
        })

        const csvContent = "\uFEFF" + [csvHeader, ...csvRows].join("\n") // Add BOM for Excel support

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="trips-export-${new Date().toISOString().split('T')[0]}.csv"`
            }
        })
    }

    return NextResponse.json({
        data: trips,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    })
}

// Create new Trip
export async function POST(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        // Basic validation could be added here similar to vehicles/users
        const trip = await prisma.trip.create({
            data: {
                vehicleId: body.vehicleId,
                driverId: body.driverId,
                departureDate: new Date(body.departureDate),
                returnDate: body.returnDate ? new Date(body.returnDate) : null,
                origin: body.origin,
                destination: body.destination,
                mileageStart: body.mileageStart,
                mileageEnd: body.mileageEnd || null,
                description: body.description,
                status: body.status || "ONGOING"
            }
        })

        // Update vehicle status/odometer if needed? 
        // For simple CRUD, we just save the trip for now. 
        // More complex logic (like locking vehicle) can be added later if requested.

        return NextResponse.json(trip)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

// Update trip status or details
export async function PUT(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, ...data } = body

        // Handle date conversions if they exist in update data
        if (data.departureDate) data.departureDate = new Date(data.departureDate)
        if (data.returnDate) data.returnDate = new Date(data.returnDate)

        const trip = await prisma.trip.update({
            where: { id },
            data
        })
        return NextResponse.json(trip)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = parseInt(searchParams.get("id") || "0")

        if (!id) throw new Error("ID required")

        await prisma.trip.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
