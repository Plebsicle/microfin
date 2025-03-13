-- DropIndex
DROP INDEX "Account_accountNumber_idx";

-- DropIndex
DROP INDEX "Transaction_createdAt_idx";

-- DropIndex
DROP INDEX "Transaction_receiverAccountId_idx";

-- DropIndex
DROP INDEX "Transaction_senderAccountId_idx";

-- DropIndex
DROP INDEX "Transaction_status_idx";

-- DropIndex
DROP INDEX "Transaction_type_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");
