
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    const whereClause: any = {};
    if (role && role !== "ALL") {
        whereClause.role = role;
    }

    if (search) {
        whereClause.OR = [
            { username: { contains: search } }, // SQLite default is case-insensitive usually, but depends on collation
            { ThaiName: { contains: search } },
            { EngName: { contains: search } }
        ]
    }

    const users = await prisma.user.findMany({
        where: whereClause,
        orderBy: { username: 'asc' }
    })
    return NextResponse.json(users)
}

const userSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(1),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
    ThaiName: z.string().optional(),
    EngName: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    employeeId: z.string().optional(),
    section: z.string().optional(),
    image_url: z.string().optional(),
})

export async function POST(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const data = userSchema.parse(body)

        const user = await prisma.user.create({
            data: {
                id: "user-" + Date.now(),
                username: data.username,
                password: data.password,
                role: data.role,
                ThaiName: data.ThaiName,
                EngName: data.EngName,
                email: data.email || null,
                employeeId: data.employeeId,
                Section: data.section, // Map section to Section
                image_url: data.image_url // Add image_url
            }
        })
        return NextResponse.json(user)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, ...data } = body

        // Simple validation or schema parse
        // Map potentially lowercase section to Section
        const updateData: any = { ...data }
        if (data.section) {
            updateData.Section = data.section
            delete updateData.section
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        })
        return NextResponse.json(user)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw new Error("ID required")

        await prisma.user.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
