
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

export async function GET() {
    try {
        const fileBuffer = await fs.readFile(DB_PATH);
        const date = new Date().toISOString().split("T")[0];

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Disposition": `attachment; filename="backup-${date}.sqlite"`,
                "Content-Type": "application/x-sqlite3",
            },
        });
    } catch (error) {
        console.error("Backup error:", error);
        return NextResponse.json(
            { error: "Failed to create backup" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        if (!file.name.endsWith(".db") && !file.name.endsWith(".sqlite")) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload a .db or .sqlite file." },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create a backup of the current db before overwriting, just in case? 
        // Plan didn't specify, but it's good practice. 
        // However, for simplicity and adherence to "overwrite" request:
        await fs.writeFile(DB_PATH, buffer);

        return NextResponse.json({ success: true, message: "Database restored successfully" });
    } catch (error) {
        console.error("Restore error:", error);
        return NextResponse.json(
            { error: "Failed to restore database" },
            { status: 500 }
        );
    }
}
