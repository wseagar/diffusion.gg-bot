import { ButtonInteraction, CacheType, ActionRowBuilder, SelectMenuBuilder } from "discord.js";
import { getJobByMessageId } from "../../../rest/db";
import { externalChoice } from "../../../rest/static";

export async function selectStyleMenu(interaction: ButtonInteraction<CacheType>) {
  await interaction.deferReply({ ephemeral: true });
  const job = await getJobByMessageId(interaction.message.id);
  if (!job) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }
  const styleRow = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    new SelectMenuBuilder()
      .setCustomId(`style|${job.id}`)
      .setPlaceholder("Change style")
      .addOptions(
        externalChoice.map((externalChoice) => ({
          label: externalChoice.name,
          value: externalChoice.value,
        })),
      ),
  );

  await interaction.editReply({
    content: "🎨 To change the style, select one from the menu:",
    components: [styleRow],
  });
}
