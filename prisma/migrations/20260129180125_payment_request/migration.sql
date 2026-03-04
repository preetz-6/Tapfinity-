-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
