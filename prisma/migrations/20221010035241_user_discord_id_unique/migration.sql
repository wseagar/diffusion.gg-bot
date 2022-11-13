/*
  Warnings:

  - A unique constraint covering the columns `[discord_id]` on the table `discord_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "discord_users_discord_id_key" ON "discord_users"("discord_id");
