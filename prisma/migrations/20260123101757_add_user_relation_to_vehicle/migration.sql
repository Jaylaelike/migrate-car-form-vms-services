/*
  Warnings:

  - You are about to drop the column `capacity` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Vehicle` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licensePlate" TEXT NOT NULL,
    "province" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "type" TEXT,
    "section" TEXT,
    "userId" TEXT,
    "currentOdometer" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "createdAt", "currentOdometer", "id", "imageUrl", "licensePlate", "model", "province", "section", "type", "updatedAt") SELECT "brand", "createdAt", "currentOdometer", "id", "imageUrl", "licensePlate", "model", "province", "section", "type", "updatedAt" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
