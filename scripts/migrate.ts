import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration...');

    // 1. Migrate Users from user_update.sql
    const userSqlPath = path.join(process.cwd(), 'user_update.sql');
    const userSqlContent = fs.readFileSync(userSqlPath, 'utf8');

    // Basic regex to find INSERT values for User
    // Pattern matches: ('id', 'email', 'username', ...)
    // Note: This is a simple parser and might need adjustment if SQL format varies greatly
    const userRegex = /\('([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)/g;

    let userMatch;
    let userCount = 0;

    while ((userMatch = userRegex.exec(userSqlContent)) !== null) {
        const [
            _, id, email, username, password, createdAt, updatedAt, employeeId,
            department, division, engName, mobilePhone, position, section, thaiName, imageUrl
        ] = userMatch;

        try {
            await prisma.user.upsert({
                where: { id },
                update: {
                    email: email === 'NULL' ? null : email,
                    username,
                    password,
                    employeeId,
                    Department: department === 'NULL' ? null : department,
                    Division: division === 'NULL' || division === 'None' ? null : division,
                    EngName: engName,
                    Mobile_Phone: mobilePhone === 'NULL' || mobilePhone === '-' ? null : mobilePhone,
                    Position: position,
                    Section: section === 'NULL' || section === 'None' ? null : section,
                    ThaiName: thaiName,
                    image_url: imageUrl
                },
                create: {
                    id,
                    email: email === 'NULL' ? null : email,
                    username,
                    password,
                    employeeId,
                    Department: department === 'NULL' ? null : department,
                    Division: division === 'NULL' || division === 'None' ? null : division,
                    EngName: engName,
                    Mobile_Phone: mobilePhone === 'NULL' || mobilePhone === '-' ? null : mobilePhone,
                    Position: position,
                    Section: section === 'NULL' || section === 'None' ? null : section,
                    ThaiName: thaiName,
                    image_url: imageUrl
                }
            });
            userCount++;
        } catch (e) {
            console.error(`Failed to upsert user ${id}:`, e);
        }
    }
    console.log(`Migrated ${userCount} users.`);

    console.log(`Migrated ${userCount} users.`);

    // 2. Migrate Cars Form data from online_reporting.sql
    const carsSqlPath = path.join(process.cwd(), 'online_reporting.sql');
    const carsSqlContent = fs.readFileSync(carsSqlPath, 'utf8');

    // Clean up values helpers
    const cleanStr = (s: string) => s === 'NULL' || s === "''" ? null : s.replace(/'/g, '');
    const cleanNum = (s: string) => s === 'NULL' ? null : Number(s);
    const cleanDecimal = (s: string) => s === 'NULL' ? null : Number(s); // Prisma Decimal can take number or string

    // 2.1 Migrate Vehicles from `license` table (Master List)
    console.log('Migrating vehicles from license table...');
    // INSERT INTO `license` (`id`, `Section`, `Car`, `ต้นทาง`, `ปลายทาง`, `รายละเอียดการใช้งาน`, `ผู้ใช้รถ`, `Status`)
    const licenseRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)',\s*('?[^',]*'?|NULL),\s*('?[^',]*'?|NULL),\s*('?[^',]*'?|NULL),\s*('?[^',]*'?|NULL),\s*'([^']*)'\)/g;

    let licenseMatch;
    let licenseCount = 0;
    const vehicles = new Set<string>();

    while ((licenseMatch = licenseRegex.exec(carsSqlContent)) !== null) {
        const [
            _, id, section, car, origin, dest, desc, user, statusRaw
        ] = licenseMatch;

        const license = cleanStr(car);
        if (!license) continue;

        let status = 'AVAILABLE';
        const rawStatus = cleanStr(statusRaw);
        if (rawStatus === 'Stand By') status = 'ใช้งาน'; // Active/Available
        else if (rawStatus === 'On Process') status = 'IN_USE'; // Currently in use? Or just active? Let's assume IN_USE for now or keep 'ใช้งาน' if it means "Active in fleet".
        // Request says: create status for "เลิกใช้งาน", "ใช้งาน"
        // So we should probably default to "ใช้งาน" if it's in the fleet.
        if (rawStatus === 'Stand By') status = 'ใช้งาน';

        await prisma.vehicle.upsert({
            where: { licensePlate: license },
            update: {
                section: cleanStr(section),
                status: status
            },
            create: {
                licensePlate: license,
                section: cleanStr(section),
                status: status,
                currentOdometer: 0
            }
        });
        vehicles.add(license);
        licenseCount++;
    }
    console.log(`Migrated ${licenseCount} vehicles from license table.`);

    // 2.2 Migrate Trips from `carsform`
    // Regex for carsform INSERTs
    // INSERT INTO `carsform` VALUES ...
    // Values: (id, licensePlate, dateGo, dateBack, desc, origin, dest, mileGo, mileBack, mileTotal, mileFuel, fuelLiters, fuelPrice, fuelStation, fuelProv, carUser, driver, status)
    const carsRegex = /\((\d+),\s*'([^']*)',\s*('?[^',]*'?|NULL),\s*('?[^',]*'?|NULL),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+|NULL),\s*(\d+|NULL),\s*(\d+|NULL),\s*(\d+|NULL),\s*([\d\.]+|NULL),\s*([\d\.]+|NULL),\s*('?[^',]*'?|NULL),\s*('?[^',]*'?|NULL),\s*'([^']*)',\s*'([^']*)',\s*('?[^',]*'?|NULL)\)/g;

    let reportMatch;
    let tripCount = 0;
    let vehicleFallbackCount = 0;

    while ((reportMatch = carsRegex.exec(carsSqlContent)) !== null) {
        const [
            _, idStr, licensePlate, dateGoStr, dateBackStr, description, origin, destination,
            mileGoStr, mileBackStr, mileTotalStr, mileFuelStr, fuelLitersStr, fuelPriceStr,
            fuelStationRaw, fuelProvRaw, carUser, driver, statusRaw
        ] = reportMatch;

        const license = cleanStr(licensePlate);
        if (!license) continue;

        // Upsert Vehicle (Fallback)
        if (!vehicles.has(license)) {
            await prisma.vehicle.upsert({
                where: { licensePlate: license },
                update: {},
                create: {
                    licensePlate: license,
                    status: 'AVAILABLE', // Default
                    currentOdometer: 0
                }
            });
            vehicles.add(license);
            vehicleFallbackCount++;
        }

        // Find Driver (User) - Fuzzy match roughly by Thai Name
        // This is tricky. For now, let's try to match exact name if possible, or skip linking if strictly necessary.
        // Given the task, we might just store the name string if we can't link, but schema links to User.
        // Let's try to find a user strictly by ThaiName first.
        let driverId = null;
        const driverName = cleanStr(driver);
        if (driverName) {
            const user = await prisma.user.findFirst({
                where: { ThaiName: { contains: driverName } }
            });
            if (user) driverId = user.id;
        }

        // Dates
        const dateGo = cleanStr(dateGoStr);
        const dateBack = cleanStr(dateBackStr);

        if (!dateGo) continue; // Skip if no date

        const departureDate = new Date(dateGo);
        const returnDate = dateBack ? new Date(dateBack) : null;

        // Status mapping
        let status = 'ONGOING';
        const rawStatus = cleanStr(statusRaw);
        if (rawStatus === 'จอด') status = 'COMPLETED';

        try {
            const trip = await prisma.trip.create({
                data: {
                    vehicle: { connect: { licensePlate: license } },
                    driver: driverId ? { connect: { id: driverId } } : undefined,
                    departureDate,
                    returnDate,
                    origin: cleanStr(origin),
                    destination: cleanStr(destination),
                    description: cleanStr(description),
                    mileageStart: cleanNum(mileGoStr) || 0,
                    mileageEnd: cleanNum(mileBackStr),
                    totalDistance: cleanNum(mileTotalStr),
                    status,
                    fuelLogs: {
                        create: (cleanDecimal(fuelLitersStr) || 0) > 0 ? [{
                            odometer: cleanNum(mileFuelStr) || cleanNum(mileBackStr) || 0, // Fallback
                            liter: cleanDecimal(fuelLitersStr)!,
                            price: cleanDecimal(fuelPriceStr)!,
                            station: cleanStr(fuelStationRaw),
                            location: cleanStr(fuelProvRaw)
                        }] : []
                    }
                }
            });
            tripCount++;
        } catch (e) {
            console.error(`Failed to import trip ${idStr}:`, e);
            // console.log('Data was:', reportMatch);
        }
    }

    console.log(`Migrated ${vehicleFallbackCount} fallback vehicles from trips.`);
    console.log(`Migrated ${tripCount} trips.`);

    // 3. Link Vehicles to Users (based on carUser from trips)
    // We iterate through all vehicles and try to find a user that matches the 'carUser' 
    // we saw in the trip data. 
    // Since we didn't store carUser directly on vehicle in step 2 (we only did section),
    // we need to re-scan or just do it inside the trip loop.
    // Actually, distinct carUser per vehicle is better.
    // Let's re-scan cars content to build a map of License -> carUser

    // Reset regex index
    carsRegex.lastIndex = 0;
    const vehicleOwners = new Map<string, string>();

    while ((reportMatch = carsRegex.exec(carsSqlContent)) !== null) {
        const [
            _, _id, licensePlate, _d1, _d2, _desc, _org, _dest,
            _m1, _m2, _mt, _mf, _fl, _fp, _fs, _fpr, carUser
        ] = reportMatch;

        const license = cleanStr(licensePlate);
        const ownerName = cleanStr(carUser);

        if (license && ownerName) {
            vehicleOwners.set(license, ownerName);
        }
    }

    console.log(`Found ${vehicleOwners.size} vehicle owner mappings.`);

    for (const [license, ownerName] of vehicleOwners) {
        // Find User by ThaiName
        const user = await prisma.user.findFirst({
            where: { ThaiName: { contains: ownerName } } // Exact or partial? data varies.
        });

        if (user) {
            await prisma.vehicle.update({
                where: { licensePlate: license },
                data: {
                    userId: user.id,
                    section: user.Section // Sync section from User
                }
            });
            // console.log(`Linked ${license} to user ${user.ThaiName} (Section: ${user.Section})`);
        } else {
            // console.log(`No user found for ${ownerName} (Vehicle: ${license})`);
        }
    }
    console.log("Finished linking vehicles to users.");

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
