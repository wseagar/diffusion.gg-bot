/*
  Warnings:

  - A unique constraint covering the columns `[discord_id]` on the table `discord_servers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "discord_servers_discord_id_key" ON "discord_servers"("discord_id");
