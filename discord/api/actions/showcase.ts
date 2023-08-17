import { ButtonInteraction, CacheType, TextChannel, EmbedBuilder } from "discord.js";
import { getJob, getImages } from "../../../rest/db";
import { getDbServer } from "../../lib/diffusion";

export async function processShowcase(
  interaction: ButtonInteraction<CacheType>,
  channelID: string,
  emoji: string,
  response: string,
  action: string,
) {
  console.log(interaction.customId);
  const [_, jobId, imageId, imageIdx] = interaction.customId.split("|");
  console.log(`showcase: job:${jobId}, img:${imageId}, imgIdx:${imageIdx} chan:${channelID}, ${emoji}, ${response}, ${action}`);
  await interaction.deferReply({ ephemeral: true });
  const job = await getJob(jobId);
  if (!job) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }
  const image = (await getImages(jobId)).find((img) => img.id === imageId);
  if (!image) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }
  let dbServer = await getDbServer(interaction);
  if (image.nsfw && dbServer?.nsfw_filter) {
    await interaction.editReply(`You can't ${emoji} a NSFW image.`);
    return;
  }

  const channel = (await interaction.client.channels.fetch(channelID)) as TextChannel;
  if (!channel) {
    await interaction.editReply("The showcase channel could not be found.");
    return;
  }

  const sourceMessage = await interaction.channel?.messages.fetch(job.discord_message_id as string);
  var attachments = Array.from(sourceMessage ? sourceMessage.attachments.values() : interaction.message.attachments.values())

  const likeEmbed = new EmbedBuilder()
    .setColor("Blurple")
    .setTitle(emoji)
    .setURL(sourceMessage ? sourceMessage.url : interaction.message.url)
    .setImage(attachments[parseInt(imageIdx)] ? attachments[parseInt(imageIdx)].url : image.uri)
    .setDescription(`by <@${job.args.discord_user}>\n${action} by <@${interaction.user.id}>`)
    .setFooter({
      text: `Click the top ${emoji} to view the generation`,
    });
  const showcaseMessage = await (channel as TextChannel).send({
    embeds: [likeEmbed],
  });
  await showcaseMessage.react(emoji);
  const showcaseUrlEmbed = new EmbedBuilder().setColor("Blurple").setTitle(response).setURL(showcaseMessage.url);
  await interaction.editReply({ embeds: [showcaseUrlEmbed] });
}
