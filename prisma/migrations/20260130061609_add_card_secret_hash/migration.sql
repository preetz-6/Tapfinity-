/*
  Warnings:

  - A unique constraint covering the columns `[cardSecretHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cardSecretHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_cardSecretHash_key" ON "User"("cardSecretHash");
