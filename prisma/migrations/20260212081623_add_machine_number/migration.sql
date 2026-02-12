-- CreateTable
CREATE TABLE "MachineNumber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineId" TEXT NOT NULL,
    "machineNo" INTEGER NOT NULL,
    CONSTRAINT "MachineNumber_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MachineNumber_machineId_idx" ON "MachineNumber"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "MachineNumber_machineId_machineNo_key" ON "MachineNumber"("machineId", "machineNo");
