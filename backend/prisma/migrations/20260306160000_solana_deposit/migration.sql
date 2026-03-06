-- Add Solana commitment deposit fields
ALTER TABLE "Task" ADD COLUMN "walletAddress" TEXT;
ALTER TABLE "Task" ADD COLUMN "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.1;
ALTER TABLE "Task" ADD COLUMN "solanaTxSignature" TEXT;

-- Backfill legacy rows (if any) so we can enforce NOT NULL + UNIQUE
UPDATE "Task"
SET
  "walletAddress" = COALESCE("walletAddress", 'LEGACY'),
  "solanaTxSignature" = COALESCE("solanaTxSignature", 'LEGACY-' || "id")
WHERE
  "walletAddress" IS NULL
  OR "solanaTxSignature" IS NULL;

ALTER TABLE "Task" ALTER COLUMN "walletAddress" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "solanaTxSignature" SET NOT NULL;

CREATE UNIQUE INDEX "Task_solanaTxSignature_key" ON "Task"("solanaTxSignature");

