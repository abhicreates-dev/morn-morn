-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "stakeAmountLamports" TEXT,
ADD COLUMN     "stakeReceivedAt" TIMESTAMP(3),
ADD COLUMN     "userWalletAddress" TEXT;
