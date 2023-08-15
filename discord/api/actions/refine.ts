import { ButtonInteraction, CacheType } from "discord.js";
import { getJob, getImages } from "../../../rest/db";
import { getDbServer, generateImage } from "../../lib/diffusion";
import { randomIntFromInterval, getCFGOnSampler, MAX_STEPS } from "../../lib/utils";

export async function processRefine(interaction: ButtonInteraction<CacheType>) {
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

  // await generateImage({
  //   img2img_strength: 0.5,
  //   interaction,
  //   prompt: job.args.raw_prompt,
  //   prompt_engineer: job.args.prompt_engineer,
  //   prompt_engineer_seed: job.args.prompt_engineer_seed,
  //   type: image.uri ? "img2img" : "txt2img",
  //   n_samples: 1,
  //   //refine should use the most steps by default due to only doing 1 image at a time
  //   ddim_steps: MAX_STEPS,
  //   seed: randomIntFromInterval(1, 100000),
  //   reroll: true,
  //   style: job.args.style,
  //   discord_response: job.args.discord_response,
  //   width: job.args?.width ?? 512,
  //   height: job.args?.height ?? 512,
  //   image_url: image.uri ?? undefined,
  //   scale: job.args.scale ?? getCFGOnSampler(job.args.sampler ?? "ddim"),
  //   negative_prompt: job.args.negative_prompt ?? "",
  //   upscale: customId === "option_upscale" ? true : false,
  //   fix_faces: customId === "option_fix_face" ? true : false,
  //   // old jobs without a sampler would of been ddim
  //   sampler: job.args.sampler ?? "ddim",
  // });
}
