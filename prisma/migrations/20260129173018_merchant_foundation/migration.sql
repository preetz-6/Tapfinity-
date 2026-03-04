-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'CREATE_MERCHANT';
ALTER TYPE "AdminActionType" ADD VALUE 'BLOCK_MERCHANT';

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantTransaction" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "txId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_email_key" ON "Merchant"("email");

-- AddForeignKey
ALTER TABLE "MerchantTransaction" ADD CONSTRAINT "MerchantTransaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantTransaction" ADD CONSTRAINT "MerchantTransaction_txId_fkey" FOREIGN KEY ("txId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
