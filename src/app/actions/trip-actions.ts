"use server"

import prisma from "@/lib/db"

export async function getTripDetails(tripId: number) {
    if (!tripId) return null

    try {
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

        if (!trip) return null

        // Convert Decimal to number/string to plain object
        return {
            ...trip,
            fuelLogs: trip.fuelLogs.map(log => ({
                ...log,
                liter: Number(log.liter),
                price: Number(log.price)
            }))
        }
    } catch (error) {
        console.error("Failed to fetch trip details:", error)
        return null
    }
}
