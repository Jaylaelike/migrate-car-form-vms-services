-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "employeeId" TEXT,
    "Department" TEXT,
    "Division" TEXT,
    "EngName" TEXT,
    "Mobile_Phone" TEXT,
    "Position" TEXT,
    "Section" TEXT,
    "ThaiName" TEXT,
    "image_url" TEXT
);
