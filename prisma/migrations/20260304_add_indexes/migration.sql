-- Missing indexes for performance
CREATE INDEX IF NOT EXISTS "Transaction_userId_createdAt_idx"     ON "Transaction"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx"            ON "Transaction"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MerchantTransaction_merchantId_idx"   ON "MerchantTransaction"("merchantId");
CREATE INDEX IF NOT EXISTS "MerchantTransaction_merchantId_createdAt_idx" ON "MerchantTransaction"("merchantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentRequest_status_expiresAt_idx"  ON "PaymentRequest"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "PaymentRequest_merchantId_idx"        ON "PaymentRequest"("merchantId");
CREATE INDEX IF NOT EXISTS "PaymentAttemptLog_merchantId_createdAt_idx" ON "PaymentAttemptLog"("merchantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentAttemptLog_status_createdAt_idx"    ON "PaymentAttemptLog"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "PaymentAttemptLog_ipAddress_createdAt_idx" ON "PaymentAttemptLog"("ipAddress", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminActionLog_adminId_idx"           ON "AdminActionLog"("adminId");
CREATE INDEX IF NOT EXISTS "AdminActionLog_createdAt_idx"         ON "AdminActionLog"("createdAt" DESC);
