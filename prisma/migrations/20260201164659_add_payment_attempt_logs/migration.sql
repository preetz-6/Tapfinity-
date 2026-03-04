-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "PaymentAttemptLog" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "userId" TEXT,
    "paymentRequestId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttemptLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentAttemptLog" ADD CONSTRAINT "PaymentAttemptLog_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttemptLog" ADD CONSTRAINT "PaymentAttemptLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
