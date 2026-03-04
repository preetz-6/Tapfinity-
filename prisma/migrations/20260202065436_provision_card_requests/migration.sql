-- CreateEnum
CREATE TYPE "ProvisionStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ProvisionCardRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "status" "ProvisionStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvisionCardRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProvisionCardRequest_userId_idx" ON "ProvisionCardRequest"("userId");

-- CreateIndex
CREATE INDEX "ProvisionCardRequest_adminId_idx" ON "ProvisionCardRequest"("adminId");

-- AddForeignKey
ALTER TABLE "ProvisionCardRequest" ADD CONSTRAINT "ProvisionCardRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvisionCardRequest" ADD CONSTRAINT "ProvisionCardRequest_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
