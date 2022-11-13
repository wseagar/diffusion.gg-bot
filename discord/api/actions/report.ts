import { ButtonInteraction, CacheType, Colors, TextChannel } from "discord.js";
import { getJobByMessageId } from "../../../rest/db";
import { createFlaggedForReviewRow } from "../../lib/buttons";

export async function processReport(interaction: ButtonInteraction<CacheType>) {
  const job = await getJobByMessageId(interaction.message.id);
  if (!job) {
    await interaction.reply("Sorry! An unknown error occured.");
    return;
  }
  if (!interaction.channel) {
    await interaction.reply("Sorry! You can only flag messages in a channel.");
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  let embeds = interaction.message.embeds.map((embed, idx) => {
    if (!embed.image) {
      return {
        title: embed.title as string,
        url: embed.url as string,
        color: Colors.Orange,
        description: embed.description as string,
      };
    } else
      return {
        color: Colors.Orange,
        image: {
          url: embed.image?.url,
        },
      };
  });
  const baseEmbed = {
    color: Colors.Orange,
    title: "⚠️ Flagged",
    url: interaction.message.url,
    description: `<@${interaction.user.id}> has flagged a generation`,
  };
  embeds.unshift(baseEmbed);

  try {
    const channel = (await interaction.client.channels.fetch(
      process.env.DISCORD_REPORT_CHANNEL_ID as string,
    )) as TextChannel;
    if (!channel) {
      await interaction.editReply("The flagging channel could not be found.");
      return;
    }
    channel.send({
      embeds: embeds,
      components: [createFlaggedForReviewRow(interaction.message.id, interaction.channel.id)],
    });
    await interaction.editReply("This generation was flagged for review");
  } catch (error) {
    console.log(error);
    await interaction.editReply("There was an issue flagging this generation");
  }
}
