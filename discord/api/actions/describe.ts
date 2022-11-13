import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { generateImage, generateImg2Prompt } from "../../lib/diffusion";
import { getCFGOnSampler, getStepsOnSampler, MAX_STEPS, randomIntFromInterval } from "../../lib/utils";

export async function processDescribe(interaction: ChatInputCommandInteraction<CacheType>) {
  const imageUrl = interaction.options.getString("img_url") ?? undefined;
  if (!imageUrl) {
    // never happening
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  await generateImg2Prompt({ interaction, img2prompt_url: imageUrl });
}
