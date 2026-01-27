import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: npx tsx scripts/update_vehicle.ts <license_plate> <new_status>");
        console.log("Example: npx tsx scripts/update_vehicle.ts 9กฬ-337 เลิกใช้งาน");
        return;
    }

    const licensePlate = args[0];
    const newStatus = args[1];

    try {
        const vehicle = await prisma.vehicle.update({
            where: { licensePlate },
            data: { status: newStatus }
        });
        console.log(`✅ Successfully updated vehicle ${licensePlate} to status '${newStatus}'`);
        console.log(vehicle);
    } catch (error) {
        console.error(`❌ Failed to update vehicle ${licensePlate}. It might not exist.`);
        console.error(error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
