
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Starting user image update...")

    // Fetch all users who have an employeeId
    const users = await prisma.user.findMany({
        where: {
            employeeId: {
                not: null
            }
        }
    })

    console.log(`Found ${users.length} users with employeeId.`)

    let updatedCount = 0

    for (const user of users) {
        if (!user.employeeId) continue

        const imageUrl = `https://mis.thaipbs.or.th/files/emp/${user.employeeId}.jpg`

        await prisma.user.update({
            where: { id: user.id },
            data: {
                image_url: imageUrl
            }
        })
        updatedCount++
    }

    console.log(`Successfully updated ${updatedCount} users.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
