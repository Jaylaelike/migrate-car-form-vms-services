
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Seeding Admin user...")

    // Create or update Admin user
    const admin = await prisma.user.upsert({
        where: { username: "Admin" },
        update: {
            password: "carform123456",
            role: "ADMIN",
            EngName: "System Administrator",
            ThaiName: "ผู้ดูแลระบบ",
        },
        create: {
            id: "admin-id-" + Date.now(), // Generate a unique ID if creating new
            username: "Admin",
            password: "carform123456",
            role: "ADMIN",
            EngName: "System Administrator",
            ThaiName: "ผู้ดูแลระบบ",
            email: "admin@example.com"
        }
    })

    console.log("Admin user seeded:", admin)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
