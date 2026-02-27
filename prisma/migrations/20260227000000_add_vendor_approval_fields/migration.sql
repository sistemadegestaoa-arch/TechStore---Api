-- AlterTable
ALTER TABLE "users" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedBy" TEXT;

-- Update existing vendors and admins to be approved
UPDATE "users" SET "isApproved" = true WHERE "role" IN ('ADMIN', 'CUSTOMER');

-- Update existing active vendors to be approved (optional - remove if you want to review all)
-- UPDATE "users" SET "isApproved" = true WHERE "role" = 'VENDOR' AND "isActive" = true;
