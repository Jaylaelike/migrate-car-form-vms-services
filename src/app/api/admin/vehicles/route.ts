
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status && status !== "ALL") {
        whereClause.status = status;
    }

    if (search) {
        whereClause.OR = [
            { licensePlate: { contains: search } },
            { brand: { contains: search } },
            { model: { contains: search } },
            { section: { contains: search } }
        ]
    }

    const vehicles = await prisma.vehicle.findMany({
        where: whereClause,
        orderBy: { licensePlate: 'asc' },
        include: {
            user: true // owner/assignee
        }
    })
    return NextResponse.json(vehicles)
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()

        // Basic validation
        if (!body.licensePlate) throw new Error("License plate is required")

        const vehicle = await prisma.vehicle.create({
            data: {
                licensePlate: body.licensePlate,
                brand: body.brand || "",
                model: body.model || "",
                type: body.type || "รถยนต์",
                status: body.status || "AVAILABLE",
                currentOdometer: Number(body.currentOdometer) || 0,
                section: body.section || "",
                imageUrl: body.imageUrl || "",
                // Note: user (assignment) logic is separate or defaults to null
            }
        })
        return NextResponse.json(vehicle)
    } catch (error: any) {
        // Unique constraint error handling
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "License plate already exists" }, { status: 409 })
        }
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

        if (!id) throw new Error("ID required")

        const vehicle = await prisma.vehicle.update({
            where: { id: Number(id) },
            data: {
                ...data,
                currentOdometer: Number(data.currentOdometer)
            }
        })
        return NextResponse.json(vehicle)
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

        await prisma.vehicle.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
