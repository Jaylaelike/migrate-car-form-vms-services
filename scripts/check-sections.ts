
import prisma from "@/lib/db"

async function main() {
    const vehicles = await prisma.vehicle.findMany({
        select: { section: true },
        distinct: ['section']
    })
    console.log("Vehicle Sections:", vehicles.map(v => v.section))

    const users = await prisma.user.findMany({
        select: { Section: true },
        distinct: ['Section']
    })
    console.log("User Sections:", users.map(u => u.Section))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
