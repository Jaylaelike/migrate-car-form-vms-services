
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("⚠️  Starting FULL database cleanup...")

    // 1. FuelLog
    console.log("Deleting FuelLogs...")
    await prisma.fuelLog.deleteMany({})

    // 2. Trip
    console.log("Deleting Trips...")
    await prisma.trip.deleteMany({})

    // 3. Vehicle
    console.log("Deleting Vehicles...")
    await prisma.vehicle.deleteMany({})

    // 4. User
    console.log("Deleting Users...")
    await prisma.user.deleteMany({})

    console.log("✅ Database cleared.")
    console.log("👉 Don't forget to run 'npm run seed' or 'npx tsx scripts/seed-admin.ts' to restore the admin user!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
