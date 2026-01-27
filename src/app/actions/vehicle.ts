"use server"

import { auth } from "@/auth"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { registerVehicleSchema } from "@/lib/schemas"

export async function createVehicle(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const formDataObj = Object.fromEntries(formData)
    const validatedFields = registerVehicleSchema.safeParse(formDataObj)

    if (!validatedFields.success) {
        return {
            error: "ข้อมูลไม่ถูกต้อง: " + validatedFields.error.issues.map(i => i.message).join(", ")
        }
    }

    const { licensePlate, brand, model, type, status, currentOdometer, section, imageUrl } = validatedFields.data

    try {
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { licensePlate }
        })

        if (existingVehicle) {
            return { error: "ทะเบียนรถนี้มีอยู่ในระบบแล้ว" }
        }
        const vehicle = await prisma.vehicle.create({
            data: {
                licensePlate,
                brand,
                model,
                type,
                status: "AVAILABLE",
                currentOdometer,
                section: validatedFields.data.section,
                // If user is authenticated, we could assign userId/section from session too.
                // But for now taking manual input or default.
                imageUrl,
                userId: session.user.id // Assign creator as owner/manager initially? Or leave null? 
                // Schema says userId String? so it's optional. Let's link it to creator for now if appropriate, 
                // but user said "Register new cars section", usually just adding to pool. 
                // Let's leave userId null or as is. schema.prisma has userId String? and user User?
                // If the requirement is "Assign to User", we might need a user picker.
                // For now, let's just create the vehicle. 
            }
        })

        revalidatePath("/")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create vehicle:", error)
        return { error: error.message || "Failed to create vehicle" }
    }
}
