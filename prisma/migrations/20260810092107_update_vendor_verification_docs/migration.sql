/*
  Warnings:

  - You are about to drop the column `bankStatement` on the `vendor_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `documentImage` on the `vendor_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `documentNumber` on the `vendor_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `vendor_verifications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vendor_verifications" DROP COLUMN "bankStatement",
DROP COLUMN "documentImage",
DROP COLUMN "documentNumber",
DROP COLUMN "documentType",
ADD COLUMN     "alvaraComercial" TEXT,
ADD COLUMN     "biProprietario" TEXT,
ADD COLUMN     "certidaoEmpresa" TEXT,
ADD COLUMN     "fotoProprietario" TEXT;
