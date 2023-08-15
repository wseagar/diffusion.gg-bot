//this is a very basic command handler for discord's library for now
import { REST, Routes } from "discord.js";
import "dotenv/config";

import * as AdminCommands from "./commands/admin";
import * as CommonCommands from "./commands/common";
import * as DrawCommands from "./commands/draw";

const commands = [CommonCommands.help, CommonCommands.prompt_guide, DrawCommands.draw].map((command) =>
  command.toJSON(),
);

const clientId = process.env.DISCORD_CLIENT_ID as string;
const token = process.env.DISCORD_TOKEN as string;

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");

    process.exit(0);
  } catch (error) {
    console.error(error);
  }
})();
