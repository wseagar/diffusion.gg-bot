import { SlashCommandBuilder } from "discord.js";
import "dotenv/config";

export const help = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows the help menu.");

export const prompt_guide = new SlashCommandBuilder()
    .setName("prompt_guide")
    .setDescription("Shows the prompt guide.");

export const credits = new SlashCommandBuilder()
    .setName("credits")
    .setDescription("Replies with your credit balance");
