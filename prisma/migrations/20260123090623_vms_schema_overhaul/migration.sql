/*
  Warnings:

  - You are about to drop the `CarUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CarUsage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licensePlate" TEXT NOT NULL,
    "province" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "type" TEXT,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "currentOdometer" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicleId" INTEGER NOT NULL,
    "driverId" TEXT,
    "departureDate" DATETIME NOT NULL,
    "returnDate" DATETIME,
    "origin" TEXT,
    "destination" TEXT,
    "description" TEXT,
    "mileageStart" INTEGER NOT NULL,
    "mileageEnd" INTEGER,
    "totalDistance" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tripId" INTEGER NOT NULL,
    "odometer" INTEGER NOT NULL,
    "liter" DECIMAL NOT NULL,
    "price" DECIMAL NOT NULL,
    "station" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
