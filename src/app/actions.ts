"use server"

import { signIn, signOut, auth } from "@/auth"
import { AuthError } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { startTripSchema, endTripSchema, fuelLogSchema, pastTripSchema } from "@/lib/schemas"
import { getApiPath } from "@/lib/utils"

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        console.log("Action: Attempting sign in...");
        const signInData = Object.fromEntries(formData);

        // Check user role for redirection
        const username = signInData.username as string;
        let redirectTo = getApiPath("/");

        if (username) {
            const user = await prisma.user.findUnique({
                where: { username }
            });
            if (user?.role === "ADMIN") {
                redirectTo = getApiPath("/admin");
            }
        }

        await signIn("credentials", { ...signInData, redirectTo })
    } catch (error) {
        if ((error as Error).message === "NEXT_REDIRECT" || (error as any).digest?.startsWith("NEXT_REDIRECT")) {
            throw error;
        }
        console.log("Action: Sign in error:", error);
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials."
                default:
                    return "Something went wrong."
            }
        }
        throw error
    }
}

export async function handleSignOut() {
    await signOut({ redirectTo: getApiPath("/login") });
}

export async function startTrip(formData: FormData) {
    const session = await auth()
    console.log("Action startTrip: Session logic check", session?.user?.id ? "Authenticated" : "Not Authenticated")
    if (!session?.user?.id) return { error: "Not authenticated (Session missing user ID)" }

    const formDataObj = Object.fromEntries(formData)
    const validatedFields = startTripSchema.safeParse(formDataObj)

    if (!validatedFields.success) {
        return {
            error: "ข้อมูลไม่ถูกต้อง: " + validatedFields.error.issues.map(i => i.message).join(", ")
        }
    }

    const { vehicleId, origin, destination, description, mileageStart } = validatedFields.data

    try {
        // Use transaction to ensure data integrity
        await prisma.$transaction(async (tx: any) => {
            const prismaTx = tx as PrismaClient;
            // 1. Verify Vehicle is available
            const vehicle = await prismaTx.vehicle.findUnique({ where: { id: vehicleId } })
            const validStatuses = ["AVAILABLE", "ใช้งาน", "Stand By"];
            if (!vehicle || !validStatuses.includes(vehicle.status)) {
                throw new Error("Vehicle is not available (Status: " + (vehicle?.status ?? "Unknown") + ")")
            }

            // 2. Create Trip
            await prismaTx.trip.create({
                data: {
                    vehicleId,
                    driverId: session.user?.id,
                    origin, // Use provided origin
                    destination,
                    description,
                    mileageStart,
                    departureDate: new Date(),
                    status: "ONGOING"
                }
            })

            // 3. Update Vehicle Status
            await prismaTx.vehicle.update({
                where: { id: vehicleId },
                data: {
                    status: "IN_USE",
                    updatedAt: new Date()
                }
            })
        })



        revalidatePath("/")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to start trip:", error)
        return { error: "เกิดข้อผิดพลาด: " + (error.message || "ไม่สามารถเริ่มงานได้") }
    }
}

export async function endTrip(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "Not authenticated" }

    const formDataObj = Object.fromEntries(formData)
    const validatedFields = endTripSchema.safeParse(formDataObj)

    if (!validatedFields.success) {
        return { error: "ข้อมูลไม่ถูกต้อง: " + validatedFields.error.issues.map(i => i.message).join(", ") }
    }

    const { tripId, mileageEnd } = validatedFields.data

    try {
        await prisma.$transaction(async (tx: any) => {
            const prismaTx = tx as PrismaClient;
            const trip = await prismaTx.trip.findUnique({ where: { id: tripId } })
            if (!trip || trip.status !== "ONGOING") {
                throw new Error("Invalid trip")
            }

            const totalDistance = mileageEnd - trip.mileageStart

            // 1. Update Trip
            await prismaTx.trip.update({
                where: { id: tripId },
                data: {
                    mileageEnd,
                    totalDistance,
                    returnDate: new Date(),
                    status: "COMPLETED"
                }
            })

            // 2. Update Vehicle
            await prismaTx.vehicle.update({
                where: { id: trip.vehicleId },
                data: {
                    status: "AVAILABLE",
                    currentOdometer: mileageEnd,
                    updatedAt: new Date()
                }
            })
        })

        revalidatePath("/")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to start trip:", error)
        return { error: error.message || "Failed to start trip" }
    }
}

export async function logFuel(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "Not authenticated" }

    const formDataObj = Object.fromEntries(formData)
    const validatedFields = fuelLogSchema.safeParse(formDataObj)

    if (!validatedFields.success) {
        return { error: "ข้อมูลไม่ถูกต้อง: " + validatedFields.error.issues.map(i => i.message).join(", ") }
    }

    const { tripId, odometer, liter, price, station, location } = validatedFields.data

    try {
        await prisma.fuelLog.create({
            data: {
                tripId,
                odometer,
                liter,
                price,
                station,
                location
            }
        })
        revalidatePath("/")
        return { success: true }

    } catch (error: any) {
        console.error("Failed to log fuel:", error)
        return { error: "เกิดข้อผิดพลาด: " + (error.message || "ไม่สามารถบันทึกข้อมูลได้") }
    }
}

export async function recordPastTrip(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { error: "Not authenticated" }

    const formDataObj = Object.fromEntries(formData) as any

    // Handle JSON parsing for fuelLogs if it exists as a string
    if (typeof formDataObj.fuelLogs === 'string') {
        try {
            formDataObj.fuelLogs = JSON.parse(formDataObj.fuelLogs as string)
        } catch (e) {
            console.error("Failed to parse fuelLogs JSON", e)
            formDataObj.fuelLogs = []
        }
    }

    const validatedFields = pastTripSchema.safeParse(formDataObj)

    if (!validatedFields.success) {
        return { error: "ข้อมูลไม่ถูกต้อง: " + validatedFields.error.issues.map(i => i.message).join(", ") }
    }

    const { vehicleId, origin, destination, description, mileageStart, mileageEnd, departureDate, returnDate, hasFuelLog, fuelLogs } = validatedFields.data

    try {
        await prisma.$transaction(async (tx: any) => {
            const prismaTx = tx as PrismaClient;

            // 1. Verify Vehicle
            const vehicle = await prismaTx.vehicle.findUnique({ where: { id: vehicleId } })
            if (!vehicle) {
                throw new Error("Vehicle not found")
            }

            // 2. Create Trip
            const trip = await prismaTx.trip.create({
                data: {
                    vehicleId,
                    driverId: session.user?.id,
                    origin,
                    destination,
                    description,
                    mileageStart,
                    mileageEnd,
                    departureDate,
                    returnDate, // Set returnDate for past trip
                    totalDistance: mileageEnd - mileageStart,
                    status: "COMPLETED" // Directly to COMPLETED
                }
            })

            // 3. Update Vehicle Odometer ONLY if this trip ends with higher mileage than current
            // Logic: If I record a trip that happened yesterday, and the car has driven today, the current odometer is likel higher.
            // So we only update if (mileageEnd > vehicle.currentOdometer)
            if (mileageEnd > vehicle.currentOdometer) {
                await prismaTx.vehicle.update({
                    where: { id: vehicleId },
                    data: {
                        currentOdometer: mileageEnd,
                        updatedAt: new Date()
                    }
                })
            }

            // 4. Create Fuel Log if requested
            if (hasFuelLog && fuelLogs && fuelLogs.length > 0) {
                for (const log of fuelLogs) {
                    await prismaTx.fuelLog.create({
                        data: {
                            tripId: trip.id,
                            odometer: log.odometer || mileageEnd, // Default to trip end if not set (though schema enforces it)
                            liter: log.liter || 0,
                            price: log.price || 0,
                            station: log.station,
                            location: log.location,
                        }
                    })
                }
            }
        })

        revalidatePath("/")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to record past trip:", error)
        return { error: error.message || "Failed to record past trip" }
    }
}
