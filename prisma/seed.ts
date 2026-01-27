import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    const sqlPath = path.join(__dirname, '../user_update.sql')
    let sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('Preparing seed data...')

    // Adapt SQL for SQLite
    // 1. Remove strict schema qualification "public".
    sql = sql.replace(/"public"\./g, '')

    // 2. Fix timestamp format for Prisma (replace space with T in dates)
    // Pattern: 'YYYY-MM-DD HH:MM:SS.mmm' -> 'YYYY-MM-DDTHH:MM:SS.mmmZ'
    // 2024-05-29 07:51:21.595 -> 2024-05-29T07:51:21.595Z
    // We use a regex that matches the specific quoted format in the file.
    sql = sql.replace(/'(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(\.\d+)?)'/g, "'$1T$2Z'")

    try {
        console.log('Cleaning User table...')
        // Delete existing records to avoid unique constraint violations
        await prisma.$executeRawUnsafe('DELETE FROM "User";')

        console.log('Executing SQL seed...')
        const count = await prisma.$executeRawUnsafe(sql)
        console.log(`Seeding finished. Result: ${count}`)
    } catch (e) {
        console.error('Error seeding data:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
