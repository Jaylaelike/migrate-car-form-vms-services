import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const vehicles = [
        { licensePlate: "6ชส-8709", brand: "Toyota", model: "Hilux Revo", type: "Pick-up", currentOdometer: 13536, status: "AVAILABLE" },
        { licensePlate: "กข-9999", brand: "Honda", model: "CRV", type: "SUV", currentOdometer: 50200, status: "AVAILABLE" },
        { licensePlate: "1นข-5678", brand: "Isuzu", model: "D-Max", type: "Pick-up", currentOdometer: 2000, status: "AVAILABLE" },
    ]

    console.log('Seeding vehicles...')
    for (const v of vehicles) {
        await prisma.vehicle.upsert({
            where: { licensePlate: v.licensePlate },
            update: {},
            create: v
        })
    }
    console.log('Vehicles seeded.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
