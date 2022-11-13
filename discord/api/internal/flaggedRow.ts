import { ButtonInteraction, CacheType, TextChannel, Colors } from "discord.js";

export async function processFlaggedRow(interaction: ButtonInteraction<CacheType>, falseFlag: boolean) {
  await interaction.deferReply({ ephemeral: true });
  const [_, messageId, channelId] = interaction.customId.split("|");

  async function logFlagReview(interaction: ButtonInteraction<CacheType>, falseFlag: boolean) {
    const flaglogChannel = (await interaction.client.channels.fetch(
      process.env.DISCORD_FLAG_LOG_CHANNEL_ID as string,
    )) as TextChannel;
    if (!flaglogChannel) {
      return await interaction.editReply("The flag logging channel could not be found.");
    }
    let embeds = interaction.message.embeds.map((embed, idx) => {
      if (!embed.image) {
        if (embed.description?.includes("has flagged a generation")) {
          return {
            color: Colors.Orange,
            description: `flagged by <@${embed.description.substring(
              embed.description.indexOf("@") + 1,
              embed.description.indexOf(">"),
            )}>`,
          };
        }
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
      url: "",
      title: falseFlag ? "False Flag Archived" : "Deletion of Flag Archived",
      description: `Reviewed by <@${interaction.user.id}>`,
    };
    embeds.unshift(baseEmbed);
    flaglogChannel.send({
      embeds: embeds,
    });
  }

  if (falseFlag) {
    logFlagReview(interaction, falseFlag);
    await interaction.message.delete();
    await interaction.editReply("The flagged generation was successfully ignored");
  } else {
    const channel = (await interaction.client.channels.fetch(channelId)) as TextChannel;
    if (!channel) {
      await interaction.editReply("The channel could not be found.");
      return;
    }
    const message = await channel.messages.fetch(messageId);
    logFlagReview(interaction, falseFlag);
    await message.delete().catch((error) => console.log("The original flagged message was already deleted."));
    await interaction.message.delete();
    await interaction.editReply("The flagged generation was successfully deleted");
  }
}
