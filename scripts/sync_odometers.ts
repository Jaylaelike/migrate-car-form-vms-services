import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Syncing vehicle odometers from latest trip history...");

    const vehicles = await prisma.vehicle.findMany({
        include: {
            trips: {
                where: { status: 'COMPLETED' },
                orderBy: { returnDate: 'desc' }, // or id desc
                take: 1,
                select: { mileageEnd: true }
            }
        }
    });

    let updatedCount = 0;

    for (const vehicle of vehicles) {
        const lastTrip = vehicle.trips[0];
        if (lastTrip && lastTrip.mileageEnd) {
            if (vehicle.currentOdometer !== lastTrip.mileageEnd) {
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: { currentOdometer: lastTrip.mileageEnd }
                });
                // console.log(`Updated ${vehicle.licensePlate}: ${vehicle.currentOdometer} -> ${lastTrip.mileageEnd}`);
                updatedCount++;
            }
        }
    }

    console.log(`Synced odometers for ${updatedCount} vehicles.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
