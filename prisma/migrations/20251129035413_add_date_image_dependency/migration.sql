-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "dueDate" DATETIME;
ALTER TABLE "Todo" ADD COLUMN "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "_TaskDeps" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TaskDeps_A_fkey" FOREIGN KEY ("A") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TaskDeps_B_fkey" FOREIGN KEY ("B") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_TaskDeps_AB_unique" ON "_TaskDeps"("A", "B");

-- CreateIndex
CREATE INDEX "_TaskDeps_B_index" ON "_TaskDeps"("B");
