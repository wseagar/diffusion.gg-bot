import {
  ButtonInteraction,
  CacheType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
} from "discord.js";

export async function selectMaskModal(interaction: ButtonInteraction<CacheType>) {
  const [customId, jobId, imageId] = interaction.customId.split("|");

  const modal = new ModalBuilder().setCustomId(`mask_modal|${jobId}|${imageId}`).setTitle("Mask Image");

  const maskInput = new TextInputBuilder()
    .setCustomId("prompt_mask")
    .setLabel("What to select?")
    .setPlaceholder("bowl of fruit")
    .setStyle(TextInputStyle.Paragraph);

  const newPromptInput = new TextInputBuilder()
    .setCustomId("prompt_new")
    .setLabel("What to replace it with?")
    .setPlaceholder("bowl of spaghetti")
    .setStyle(TextInputStyle.Paragraph);

  const maskMode = new TextInputBuilder()
    .setCustomId("mask_mode")
    .setLabel('Mask Mode: "replace" or "keep"')
    .setPlaceholder("replace")
    .setRequired(false)
    .setStyle(TextInputStyle.Short);

  const imgStrength = new TextInputBuilder()
    .setCustomId("img_strength")
    .setLabel("Image Strength: 0 to 1")
    .setPlaceholder("0.5")
    .setRequired(false)
    .setStyle(TextInputStyle.Short);

  const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(maskInput);
  const secondActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(newPromptInput);
  const thirdActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(maskMode);
  const fourthActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(imgStrength);
  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
  await interaction.showModal(modal);
}
