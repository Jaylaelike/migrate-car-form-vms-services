-- CreateTable
CREATE TABLE "CarUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licensePlate" TEXT NOT NULL,
    "departureDate" DATETIME NOT NULL,
    "returnDate" DATETIME,
    "description" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "mileageStart" INTEGER,
    "mileageEnd" INTEGER,
    "totalDistance" INTEGER,
    "refuelMileage" INTEGER,
    "fuelLiters" DECIMAL,
    "fuelPrice" DECIMAL,
    "fuelStation" TEXT,
    "fuelLocation" TEXT,
    "carUser" TEXT,
    "driver" TEXT,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
