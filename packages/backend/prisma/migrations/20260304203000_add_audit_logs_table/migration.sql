CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "userId" TEXT,
  "roleName" TEXT,
  "success" BOOLEAN NOT NULL,
  "error" TEXT,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" ("timestamp" DESC);
CREATE INDEX "audit_logs_method_timestamp_idx" ON "audit_logs" ("method", "timestamp" DESC);
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs" ("userId", "timestamp" DESC);
CREATE INDEX "audit_logs_success_timestamp_idx" ON "audit_logs" ("success", "timestamp" DESC);
