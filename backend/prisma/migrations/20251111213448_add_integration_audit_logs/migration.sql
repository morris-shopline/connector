-- Migration: Add IntegrationAuditLog model
-- Created: Tue Nov 11 21:34:48 CST 2025

-- CreateTable
CREATE TABLE IF NOT EXISTS "integration_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "connectionItemId" TEXT,
    "operation" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'success',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integration_audit_logs_userId_createdAt_idx" ON "integration_audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integration_audit_logs_connectionId_createdAt_idx" ON "integration_audit_logs"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integration_audit_logs_connectionItemId_createdAt_idx" ON "integration_audit_logs"("connectionItemId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integration_audit_logs_operation_createdAt_idx" ON "integration_audit_logs"("operation", "createdAt");

-- AddForeignKey
ALTER TABLE "integration_audit_logs" ADD CONSTRAINT "integration_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_audit_logs" ADD CONSTRAINT "integration_audit_logs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_audit_logs" ADD CONSTRAINT "integration_audit_logs_connectionItemId_fkey" FOREIGN KEY ("connectionItemId") REFERENCES "connection_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

