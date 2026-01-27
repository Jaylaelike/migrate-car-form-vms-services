
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const [vehicles, users] = await Promise.all([
            prisma.vehicle.findMany({
                select: { section: true },
                distinct: ['section'],
                where: { section: { not: null } }
            }),
            prisma.user.findMany({
                select: { Section: true },
                distinct: ['Section'],
                where: { Section: { not: null } }
            })
        ])

        const sections = new Set<string>()

        vehicles.forEach(v => {
            if (v.section) sections.add(v.section)
        })

        users.forEach(u => {
            if (u.Section) sections.add(u.Section)
        })

        return NextResponse.json(Array.from(sections).sort())
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
