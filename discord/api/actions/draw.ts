import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { generateImage } from "../../lib/diffusion";
import { getCFGOnSampler, getStepsOnSampler, MAX_STEPS, randomIntFromInterval } from "../../lib/utils";
import { openAIAskQuestion } from "../../../rest/openai";

export async function processDraw(interaction: ChatInputCommandInteraction<CacheType>, commandName: string) {
  const isDrawOne = commandName === "draw_one";

  let prompt = interaction.options.getString("prompt");
  if (!prompt || typeof prompt !== "string") {
    // never happening
    return;
  }

  const imageUrl = interaction.options.getString("img_url") ?? undefined;
  let imageStrength: number | undefined = undefined;
  let maskPrompt: string | undefined = undefined;
  let maskMode: string | undefined = undefined;

  const imageStrengthParam = interaction.options.getNumber("img_strength");
  const maskPromptParam = interaction.options.getString("mask_prompt");
  const maskModeParam = interaction.options.getString("mask_mode");
  if (imageUrl) {
    if (imageStrengthParam) {
      const num = parseFloat(imageStrengthParam.toFixed(1));
      if (num >= 1) {
        imageStrength = 0.9;
      } else if (num <= 0) {
        imageStrength = 0.1;
      } else {
        imageStrength = num;
      }
    } else {
      imageStrength = 0.75;
    }
  }

  if (imageUrl && maskPromptParam) {
    maskPrompt = maskPromptParam;
    if (maskModeParam) {
      maskMode = maskModeParam;
    } else {
      maskMode = "replace";
    }
  }

  let width = 512;
  let height = 512;

  let question = prompt;

  if (prompt.length > 800) {
    await interaction.reply("Prompt too long, please use a shorter prompt");
    return;
  }

  if (prompt.includes("--tall")) {
    width = 384;
    height = 704;
    prompt = prompt.replace(" --tall ", "");
    prompt = prompt.replace(" --tall", "");
    prompt = prompt.replace("--tall", "");
  }
  if (prompt.includes("--wide")) {
    width = 704;
    height = 384;
    prompt = prompt.replace(" --wide ", "");
    prompt = prompt.replace(" --wide", "");
    prompt = prompt.replace("--wide", "");
  }

  const orientation = interaction.options.getString("orientation");
  if (orientation === "landscape") {
    width = 704;
    height = 384;
  }
  if (orientation === "portrait") {
    width = 384;
    height = 704;
  }

  const seed = interaction.options.getInteger("seed");
  const negativePrompt = interaction.options.getString("negative_prompt");

  let fixFaces = interaction.options.getBoolean("fix_faces");
  if (fixFaces === null) {
    fixFaces = false;
  }

  let upscale = interaction.options.getBoolean("upscale");
  if (upscale === null) {
    upscale = false;
  }

  let sampler = interaction.options.getString("sampler");
  if (!sampler) {
    sampler = "k_euler";
  }

  let guidanceScale = interaction.options.getInteger("guidance");
  if (!guidanceScale) {
    guidanceScale = getCFGOnSampler(sampler);
  }

  let prompt_engineer = interaction.options.getBoolean("prompt_enhance");
  if (prompt_engineer === null) {
    prompt_engineer = true;
  }

  let prompt_engineer_seed = interaction.options.getInteger("prompt_enhance_seed");
  if (prompt_engineer_seed === null) {
    prompt_engineer_seed = randomIntFromInterval(100, 1000000);
  }

  await interaction.deferReply({ ephemeral: true });
  const lowerPrompt = prompt.toLocaleLowerCase();
  if (
    prompt.includes("?") ||
    lowerPrompt.startsWith("why ") ||
    lowerPrompt.startsWith("what ") ||
    lowerPrompt.startsWith("whats ") ||
    lowerPrompt.startsWith("what's ") ||
    lowerPrompt.startsWith("when ") ||
    lowerPrompt.startsWith("who ") ||
    lowerPrompt.startsWith("where ") ||
    lowerPrompt.startsWith("how ")
  ) {
    let result;
    try {
      result = await openAIAskQuestion(prompt);
    } catch (e) {
      console.log(e);
      // try {
      //   prompt = await openAIAskQuestion(question);
      // } catch (e) {
      //   console.log(e);

      // }
      await interaction.editReply("Sorry, an unknown error occured");
      return;
    }
    if (!result || typeof result !== "string") {
      question = prompt;
    } else {
      question = prompt;
      prompt = result;
    }
  }

  const style = interaction.options.getString("style") || "none";
  await generateImage({
    interaction,
    prompt,
    prompt_engineer: prompt_engineer,
    prompt_engineer_seed: prompt_engineer ? prompt_engineer_seed : undefined,
    type: imageUrl ? "img2img" : "txt2img",
    n_samples: isDrawOne ? 1 : 2,
    ddim_steps: isDrawOne ? MAX_STEPS : getStepsOnSampler(sampler),
    reroll: false,
    seed: typeof seed === "number" ? seed : randomIntFromInterval(1, 100000),
    style,
    discord_response: question,
    is_draw_one: isDrawOne,
    width,
    height,
    image_url: imageUrl,
    img2img_strength: imageStrength,
    scale: guidanceScale,
    negative_prompt: negativePrompt ? negativePrompt : "",
    upscale,
    fix_faces: fixFaces,
    sampler,
    mask_prompt: maskPrompt,
    mask_mode: maskMode as "keep" | "replace" | undefined,
  });
}
