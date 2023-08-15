import { SlashCommandBuilder } from "discord.js";
import "dotenv/config";
import { externalChoice } from "../../rest/static";

const orientationChoices = [
  {
    name: "1:1 (Recommended)",
    value: "default",
  },
  {
    name: "Landscape",
    value: "landscape",
  },
  {
    name: "Portrait",
    value: "portrait",
  },
];

const guidanceScaleChoices = [
  {
    name: "Let the AI take control (4)",
    value: 4,
  },
  {
    name: "Let's work together (8)",
    value: 8,
  },
  {
    name: "Please listen to my prompt (12)",
    value: 12,
  },
  {
    name: "FOLLOW MY PROMPT OR ELSE (16) (default)",
    value: 16,
  },
];

const samplerChoices = [
  {
    name: "plms",
    value: "plms",
  },
  {
    name: "ddim",
    value: "ddim",
  },
  {
    name: "k_lms",
    value: "k_lms",
  },
  {
    name: "k_dpm_2",
    value: "k_dpm_2",
  },
  {
    name: "k_dpm_2_a",
    value: "k_dpm_2_a",
  },
  {
    name: "k_euler (default)",
    value: "k_euler",
  },
  {
    name: "k_euler_a",
    value: "k_euler_a",
  },
  {
    name: "k_heun",
    value: "k_heun",
  },
];

const maskModeOptions = [
  {
    name: "replace",
    value: "replace",
  },
  {
    name: "keep",
    value: "keep",
  },
];

function addDrawOptions(builder: SlashCommandBuilder) {
  return builder.addStringOption((option) =>
    option.setName("prompt").setDescription("Enter your prompt").setRequired(true),
  );
  // .addStringOption((option) =>
  //   option
  //     .setName("orientation")
  //     .setDescription("Change the images orientation")
  //     .setChoices(...orientationChoices)
  //     .setRequired(false),
  // )
  // .addStringOption((option) =>
  //   option
  //     .setName("sampler")
  //     .setDescription("Choose a sampler")
  //     .setChoices(...samplerChoices),
  // )

  // .addStringOption((option) =>
  //   option
  //     .setName("style")
  //     .setDescription("Choose a style")
  //     .setChoices(...externalChoice)
  //     .setRequired(false),
  // )
  // .addBooleanOption((option) =>
  //   option
  //     .setName("prompt_enhance")
  //     .setDescription("Whether technical qualities of the prompt should be handled by the bot")
  //     .setRequired(false),
  // )
  // .addIntegerOption((option) =>
  //   option
  //     .setName("prompt_enhance_seed")
  //     .setDescription("Set a custom seed, the same seed will always generate the same enhanced prompt")
  //     .setRequired(false),
  // )
  // .addIntegerOption((option) =>
  //   option
  //     .setName("guidance")
  //     .setDescription("Change how much the AI follows your prompt")
  //     .setChoices(...guidanceScaleChoices)
  //     .setRequired(false),
  // )
  // .addStringOption((option) =>
  //   option.setName("negative_prompt").setDescription("Concepts to remove from the output").setRequired(false),
  // )
  // .addBooleanOption((option) =>
  //   option.setName("fix_faces").setDescription("Uses a model to fix faces").setRequired(false),
  // )
  // .addBooleanOption((option) =>
  //   option.setName("upscale").setDescription("Uses a model to upscale an image").setRequired(false),
  // )
  // .addIntegerOption((option) =>
  //   option
  //     .setName("seed")
  //     .setDescription("Set a custom seed, the same seed will always generate the same images")
  //     .setRequired(false),
  // )
  // .addStringOption((option) =>
  //   option
  //     .setName("img_url")
  //     .setDescription("Supply a url to a image to use text-guided image-to-image translation")
  //     .setRequired(false),
  // )
  // .addNumberOption((option) =>
  //   option
  //     .setName("img_strength")
  //     .setDescription("Requires img_url: How strongly to follow to the image prompt")
  //     .setMinValue(0)
  //     .setMaxValue(1)
  //     .setRequired(false),
  // )
  // .addStringOption((option) =>
  //   option
  //     .setName("mask_prompt")
  //     .setDescription("Requires img_url: Use a prompt to select an image mask")
  //     .setRequired(false),
  // )
  // .addStringOption((option) =>
  //   option
  //     .setName("mask_mode")
  //     .setDescription("Requires mask_prompt: Keep the mask or replace it")
  //     .setChoices(...maskModeOptions)
  //     .setRequired(false),
  // );
}

export const draw = addDrawOptions(
  new SlashCommandBuilder().setName("draw").setDescription("Replies with generated images"),
);

export const drawOne = addDrawOptions(
  new SlashCommandBuilder().setName("draw_one").setDescription("Replies with one generated image"),
);

export const describe = new SlashCommandBuilder()
  .setName("describe")
  .setDescription("Turn a image into a prompt")
  .addStringOption((option) => option.setName("img_url").setDescription("Supply a url to describe").setRequired(true));
