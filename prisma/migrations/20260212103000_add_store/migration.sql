PRAGMA foreign_keys=OFF;

-- CreateTable: Store
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex: Store.name unique
CREATE UNIQUE INDEX "Store_name_key" ON "Store"("name");

-- Insert default store: 保土ヶ谷ガイア
INSERT INTO "Store" ("id", "name", "createdAt", "updatedAt")
VALUES ('store_hodogaya_gaia', '保土ヶ谷ガイア', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables for Machine: add storeId column
CREATE TABLE "new_Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "storeId" TEXT NOT NULL DEFAULT 'store_hodogaya_gaia',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Machine_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Machine" ("id", "name", "createdAt", "updatedAt", "storeId")
SELECT "id", "name", "createdAt", "updatedAt", 'store_hodogaya_gaia' FROM "Machine";
DROP TABLE "Machine";
ALTER TABLE "new_Machine" RENAME TO "Machine";
CREATE INDEX "Machine_storeId_idx" ON "Machine"("storeId");
CREATE UNIQUE INDEX "Machine_storeId_name_key" ON "Machine"("storeId", "name");

-- RedefineTables for EventDay: add storeId column, change unique constraint
CREATE TABLE "new_EventDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "storeId" TEXT NOT NULL DEFAULT 'store_hodogaya_gaia',
    "label" TEXT NOT NULL DEFAULT 'イベント',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventDay_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EventDay" ("id", "date", "label", "note", "createdAt", "updatedAt", "storeId")
SELECT "id", "date", "label", "note", "createdAt", "updatedAt", 'store_hodogaya_gaia' FROM "EventDay";
DROP TABLE "EventDay";
ALTER TABLE "new_EventDay" RENAME TO "EventDay";
CREATE INDEX "EventDay_storeId_idx" ON "EventDay"("storeId");
CREATE UNIQUE INDEX "EventDay_date_storeId_key" ON "EventDay"("date", "storeId");

PRAGMA foreign_keys=ON;
