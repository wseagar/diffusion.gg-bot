import { ButtonInteraction, CacheType } from "discord.js";
import { sendCaptcha } from "../../lib/captcha";

export async function processCaptcha(interaction: ButtonInteraction<CacheType>) {
  await interaction.deferReply({ ephemeral: true });
  await sendCaptcha(interaction);
}
