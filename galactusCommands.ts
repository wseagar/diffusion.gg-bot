import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";
import { externalChoice } from "./discord/static";

// function buildCommand(name: string) {
//   return new SlashCommandBuilder()
//     .setName(name)
//     .setDescription("Replies with generated images")
//     .addStringOption((option) =>
//       option
//         .setName("prompt")
//         .setDescription("Enter your prompt")
//         .setRequired(true)
//     )
//     .addIntegerOption((option) =>
//       option
//         .setName("seed")
//         .setDescription("Set a custom integer seed, default 42")
//         .setRequired(false)
//     )
//     .addIntegerOption((option) =>
//       option.setName("ddim_steps")
//         .setDescription("Number of DDIM sampler steps")
//         .setRequired(false)
//         .setMinValue(1)
//         .setMaxValue(200))
//     .addIntegerOption((option) =>
//       option.setName("n_samples")
//         .setDescription("Number of images")
//         .setRequired(false)
//         .setMinValue(1)
//         .setMaxValue(6))
// }

// const gift = new SlashCommandBuilder()
//   .setName("gift")
//   .setDescription("SUBSCRIBER ONLY: Gift credits to users")
//   .addIntegerOption((option) =>
//     option
//       .setName("credits")
//       .setDescription("How many credits to gift")
//       .setRequired(true)
//       .setMinValue(1),
//   )
//   .addUserOption((option) =>
//     option
//       .setName("user")
//       .setDescription("Who to gift to")
//       .setRequired(true))

const pods = new SlashCommandBuilder().setName("pods").setDescription("Show running pods");

const stopPod = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop pod")
  .addStringOption((option) => option.setName("pod_id").setDescription("The pod id").setRequired(true));

const terminatePod = new SlashCommandBuilder()
  .setName("terminate")
  .setDescription("Terminate pod")
  .addStringOption((option) => option.setName("pod_id").setDescription("The pod id").setRequired(true));

const startPod = new SlashCommandBuilder()
  .setName("start")
  .setDescription("Start pod")
  .addStringOption((option) => option.setName("pod_id").setDescription("The pod id").setRequired(true));

const launch = new SlashCommandBuilder()
  .setName("launch")
  .setDescription("Launch a gpu")
  .addStringOption((option) => option.setName("gpu_id").setDescription("The gpu id").setRequired(true));

const gpus = new SlashCommandBuilder().setName("gpu").setDescription("View gpus");

const queue = new SlashCommandBuilder().setName("queue").setDescription("Show queue info");

const birthday = new SlashCommandBuilder().setName("birthday").setDescription("Gets galactus birthday");

const commands = [pods, queue, birthday, stopPod, startPod, gpus, launch, terminatePod].map((command) =>
  command.toJSON(),
);

const clientId = process.env.GALACTUS_DISCORD_CLIENT_ID as string;
const token = process.env.GALACTUS_DISCORD_TOKEN as string;

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
