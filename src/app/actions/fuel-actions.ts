"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateFuelLogSchema = z.object({
    logId: z.coerce.number(),
    odometer: z.coerce.number().min(0),
    liter: z.coerce.number().min(0),
    price: z.coerce.number().min(0),
    station: z.string().optional(),
    tripId: z.coerce.number(), // Needed for revalidation path
})

export async function updateFuelLog(formData: FormData) {
    const rawData = {
        logId: formData.get("logId"),
        odometer: formData.get("odometer"),
        liter: formData.get("liter"),
        price: formData.get("price"),
        station: formData.get("station"),
        tripId: formData.get("tripId"),
    }

    const validatedFields = updateFuelLogSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        }
    }

    const data = validatedFields.data

    try {
        await prisma.fuelLog.update({
            where: { id: data.logId },
            data: {
                odometer: data.odometer,
                liter: data.liter,
                price: data.price,
                station: data.station,
            },
        })

        revalidatePath(`/trips/${data.tripId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update fuel log:", error)
        return { error: "Failed to update fuel log" }
    }
}

export async function deleteFuelLog(logId: number, tripId: number) {
    if (!logId) return { error: "Invalid Log ID" }

    try {
        await prisma.fuelLog.delete({
            where: { id: logId }
        })

        revalidatePath(`/trips/${tripId}`)
        return { success: true }
    } catch (error: any) {
        // P2025: Record to delete does not exist. We can treat this as success (idempotent).
        if (error.code === 'P2025') {
            revalidatePath(`/trips/${tripId}`)
            return { success: true }
        }

        console.error("Failed to delete fuel log:", error)
        return { error: "Failed to delete fuel log" }
    }
}
