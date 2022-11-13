import {
  ModalSubmitInteraction
} from "discord.js";
import { getJob, getImages } from "../../../rest/db";
import { getDbServer, generateImage } from "../../lib/diffusion";
import { getCFGOnSampler, MAX_STEPS, randomIntFromInterval } from "../../lib/utils";

export async function processMaskImage(interaction: ModalSubmitInteraction) {
  const [customId, jobId, imageId] = interaction.customId.split("|");
  await interaction.deferReply({ ephemeral: true });
  const job = await getJob(jobId);
  if (!job) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }
  const image = (await getImages(jobId)).find((img) => img.id === imageId);
  if (!image) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }
  let dbServer = await getDbServer(interaction);
  if (image.nsfw && dbServer?.nsfw_filter) {
    await interaction.editReply("You can't refine a NSFW image.");
    return;
  }

  const newPrompt = interaction.fields.getTextInputValue("prompt_new");
  const promptMask = interaction.fields.getTextInputValue("prompt_mask");
  let maskMode = interaction.fields.getTextInputValue("mask_mode") as any;
  if (maskMode === "keep") {
    maskMode = "keep";
  } else {
    maskMode = "replace";
  }
  let imageStrength = interaction.fields.getTextInputValue("img_strength") as any;
  if (imageStrength) {
    const num = parseFloat(Number(imageStrength).toFixed(1));
    if (num >= 1) {
      imageStrength = 0.9;
    } else if (num <= 0) {
      imageStrength = 0.1;
    } else {
      imageStrength = num;
    }
  } else {
    imageStrength = 0.5;
  }

  await generateImage({
    img2img_strength: imageStrength,
    interaction,
    prompt: newPrompt,
    prompt_engineer: false,
    type: "txt2mask",
    n_samples: 2,
    //refine should use the most steps by default due to only doing 1 image at a time
    ddim_steps: MAX_STEPS,
    seed:
      customId === "option_upscale" || customId === "option_fix_face"
        ? job.args.seed
        : randomIntFromInterval(1, 100000),
    reroll: true,
    style: job.args.style,
    discord_response: job.args.discord_response,
    width: job.args?.width ?? 512,
    height: job.args?.height ?? 512,
    image_url: image.uri ?? undefined,
    scale: job.args.scale ?? getCFGOnSampler(job.args.sampler ?? "ddim"),
    negative_prompt: job.args.negative_prompt ?? "",
    upscale: customId === "option_upscale" ? true : false,
    fix_faces: customId === "option_fix_face" ? true : false,
    // old jobs without a sampler would of been ddim
    sampler: job.args.sampler ?? "ddim",
    mask_prompt: promptMask,
    mask_mode: maskMode,
  });
}
