import { SelectMenuInteraction, CacheType } from "discord.js";
import { getJob, getImages } from "../../../rest/db";
import { generateImage } from "../../lib/diffusion";
import { getStepsOnSampler, getCFGOnSampler } from "../../lib/utils";

export async function processStyle(interaction: SelectMenuInteraction<CacheType>) {
  const [_, jobId] = interaction.customId.split("|");
  console.log(interaction.customId);
  const job = await getJob(jobId);
  if (!job) {
    await interaction.reply("Sorry! An unknown error occured.");
    return;
  }

  const style = interaction.values?.[0] || "none";
  const images = await getImages(job.id);

  await interaction.deferReply({ ephemeral: true });
  await generateImage({
    interaction,
    prompt: job.args.raw_prompt,
    prompt_engineer: false,
    type: job.args.img2img_url ? "img2img" : "txt2img",
    n_samples: images.length === 1 ? 1 : 2,
    ddim_steps: getStepsOnSampler(job.args.sampler ?? "ddim"),
    seed: job.args.seed,
    reroll: true,
    style,
    discord_response: job.args.discord_response,
    width: job.args?.width ?? 512,
    height: job.args?.height ?? 512,
    image_url: job.args.img2img_url ?? undefined,
    scale: job.args.scale ?? getCFGOnSampler(job.args.sampler ?? "ddim"),
    negative_prompt: job.args.negative_prompt ?? "",
    upscale: false,
    fix_faces: false,
    sampler: job.args.sampler ?? "ddim",
  });
}
