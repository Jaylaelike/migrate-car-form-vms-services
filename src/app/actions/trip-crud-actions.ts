"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const updateTripSchema = z.object({
    tripId: z.coerce.number(),
    origin: z.string().min(1, "Origin is required"),
    destination: z.string().min(1, "Destination is required"),
    description: z.string().optional(),
    mileageStart: z.coerce.number().min(0),
    mileageEnd: z.coerce.number().optional().nullable(),
})

export async function updateTrip(formData: FormData) {
    const rawData = {
        tripId: formData.get("tripId"),
        origin: formData.get("origin"),
        destination: formData.get("destination"),
        description: formData.get("description"),
        mileageStart: formData.get("mileageStart"),
        mileageEnd: formData.get("mileageEnd") || null,
    }

    const validatedFields = updateTripSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        }
    }

    const data = validatedFields.data

    try {
        await prisma.trip.update({
            where: { id: data.tripId },
            data: {
                origin: data.origin,
                destination: data.destination,
                description: data.description,
                mileageStart: data.mileageStart,
                mileageEnd: data.mileageEnd,
                totalDistance: (data.mileageEnd !== null && data.mileageEnd !== undefined)
                    ? (data.mileageEnd - data.mileageStart)
                    : null,
            },
        })

        // Fetch vehicleId for revalidation
        const trip = await prisma.trip.findUnique({
            where: { id: data.tripId },
            select: { vehicleId: true }
        })

        if (trip) {
            revalidatePath(`/vehicles/${trip.vehicleId}`)
        }
        revalidatePath(`/trips/${data.tripId}`)
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Failed to update trip:", error)
        return { error: "Failed to update trip" }
    }
}

export async function deleteTrip(tripId: number) {
    if (!tripId) return { error: "Invalid Trip ID" }

    try {
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            select: { status: true, vehicleId: true }
        })

        if (!trip) return { error: "Trip not found" }

        await prisma.$transaction(async (tx) => {
            // Delete the trip
            await tx.trip.delete({
                where: { id: tripId }
            })

            // If trip was ONGOING, revert vehicle status to AVAILABLE
            if (trip.status === "ONGOING") {
                await tx.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: "AVAILABLE" }
                })
            }
        })

        revalidatePath("/")
        revalidatePath(`/vehicles/${trip.vehicleId}`)
    } catch (error) {
        console.error("Failed to delete trip:", error)
        return { error: "Failed to delete trip" }
    }

    // Redirect must be outside try/catch/transaction or it catches the "NEXT_REDIRECT" error
    redirect("/")
}
