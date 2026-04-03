-- Prevent balance from ever going negative.
-- This is a database-level safety net beyond the application logic.
-- If a bug or race condition somehow bypasses the app-layer check,
-- Postgres will reject the update with a CHECK violation error.

ALTER TABLE "User" ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
