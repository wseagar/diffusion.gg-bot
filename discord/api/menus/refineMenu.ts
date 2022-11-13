import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType } from "discord.js";
import { getJob } from "../../../rest/db";

export async function selectRefineMenu(interaction: ButtonInteraction<CacheType>) {
  const [_, jobId, imageId] = interaction.customId.split("|");
  // await interaction.deferReply({ ephemeral: true });
  let options = ["option_upscale", "option_fix_face", "option_variate", "option_mask"];
  let labels = ["upscale", "fix face", "variate", "mask"];

  const job = await getJob(jobId);
  if (!job) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  const buttons: ButtonBuilder[] = [];
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const label = labels[i];
    const button = new ButtonBuilder()
      .setCustomId(`${option}|${job.id}|${imageId}`)
      .setLabel(`${label}`)
      .setStyle(ButtonStyle.Secondary);
    buttons.push(button);
  }

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
  await interaction.editReply({
    content: `Choose an action`,
    components: [buttonRow],
  });
}
