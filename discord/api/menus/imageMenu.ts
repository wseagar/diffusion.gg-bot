import {
  ButtonInteraction,
  CacheType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { getJobByMessageId, getImages, getJob } from "../../../rest/db";
import { getDbServer } from "../../lib/diffusion";
import { selectRefineMenu } from "./refineMenu";
import { processShowcase } from "../actions/showcase";

export async function selectImageMenu(interaction: ButtonInteraction<CacheType>) {
  let type;
  switch (interaction.customId) {
    case "refine_choose_img":
      type = "refine";
      break;
    case "like_choose_img":
      type = "like";
      break;
    case "curse_choose_img":
      type = "curse";
      break;
    default:
      throw new Error("Unknown command");
  }
  const job = await getJobByMessageId(interaction.message.id);
  if (!job) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }
  const images = await getImages(job.id);
  if (images.length == 1) {
    interaction.customId = `${type}|${job.id}|${images[0].id}`;
    if (type == "refine") {
      await selectRefineMenu(interaction);
      return;
    }
    if (type == "like") {
      await processShowcase(
        interaction,
        process.env.DISCORD_LIKE_CHANNEL_ID as string,
        "❤️",
        "View your favorited piece in the gallery!",
        "favorited",
      );
      return;
    }

    if (type == "curse") {
      await processShowcase(
        interaction,
        process.env.DISCORD_CURSED_CHANNEL_ID as string,
        "💀",
        "View your cursed piece in the gallery!",
        "cursed",
      );
      return;
    }
  } else {
    await interaction.deferReply({ ephemeral: true });
    const buttonRows: ActionRowBuilder<ButtonBuilder>[] = [];
    let buttons: ButtonBuilder[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const button = new ButtonBuilder()
        .setCustomId(`${type}|${job.id}|${image.id}`)
        .setLabel(`Image #${i + 1}`)
        .setStyle(ButtonStyle.Secondary);

      buttons.push(button);

      // If we have 4 buttons, or this is the last image, create a new row
      // default 8 images get made, this looks better
      if (buttons.length === 4 || i === images.length - 1) {
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
        buttonRows.push(buttonRow);
        buttons = []; // Reset the buttons for the next row
      }
    }

    await interaction.editReply({
      content: `Choose image to ${type}`,
      components: buttonRows,
    });
  }
}
