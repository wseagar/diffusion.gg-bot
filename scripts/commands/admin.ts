import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

export const nsfwFilter = new SlashCommandBuilder()
  .setName("nsfw_filter")
  .setDescription("Change the settings on the NSFW filter")
  .addStringOption((option) =>
    option
      .setName("options")
      .setDescription("Change the filter option")
      .setChoices({ name: "visible", value: "visible" }, { name: "hidden", value: "hidden" })
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
