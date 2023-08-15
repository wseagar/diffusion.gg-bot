import { ButtonInteraction, CacheType } from "discord.js";
import { getJobByMessageId, getImages } from "../../../rest/db";
import { generateImage } from "../../lib/diffusion";
import { getCFGOnSampler, getStepsOnSampler, randomIntFromInterval } from "../../lib/utils";

export async function processReroll(interaction: ButtonInteraction<CacheType>) {
  const job = await getJobByMessageId(interaction.message.id);
  if (!job) {
    await interaction.reply("Sorry! An unknown error occured.");
    return;
  }

  const images = await getImages(job.id);

  await interaction.deferReply({ ephemeral: true });
  // await generateImage({
  //   interaction,
  //   prompt: job.args.raw_prompt,
  //   prompt_engineer: job.args.prompt_engineer,
  //   prompt_engineer_seed: job.args.prompt_engineer && !job.args.img2img_url && !job.args.force_prompt_engineer_seed ? randomIntFromInterval(100, 1000000) : job.args.prompt_engineer_seed,
  //   type: job.args.img2img_url ? "img2img" : "txt2img",
  //   n_samples: images.length === 1 ? 1 : 2,
  //   ddim_steps: getStepsOnSampler(job.args.sampler ?? "ddim"),
  //   seed: randomIntFromInterval(1, 100000),
  //   reroll: true,
  //   style: job.args.style,
  //   discord_response: job.args.discord_response,
  //   width: job.args?.width ?? 512,
  //   height: job.args?.height ?? 512,
  //   image_url: job.args.img2img_url ?? undefined,
  //   scale: job.args.scale ?? getCFGOnSampler(job.args.sampler ?? "ddim"),
  //   negative_prompt: job.args.negative_prompt ?? "",
  //   upscale: false,
  //   fix_faces: false,
  //   sampler: job.args.sampler ?? "ddim",
  // });
}
