-- AlterTable
ALTER TABLE "discord_users" ADD COLUMN     "blocked" BOOLEAN DEFAULT false,
ADD COLUMN     "blocked_reason" TEXT;
