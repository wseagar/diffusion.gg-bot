import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, Colors, CommandInteraction } from "discord.js";
import { getDiscordServer, getDiscordUser, setNSFWFilter } from "../../../rest/db";
import { sexualContentMessage } from "../../lib/messages";
import { makeSubLink } from "../../lib/payment";

export async function processNSFWFilter(interaction: ChatInputCommandInteraction<CacheType>) {
  const option = interaction.options.getString("options");
  await interaction.deferReply();

  const nsfw_filter = option === "hidden" ? true : false;

  const dbUser = await getDiscordUser(interaction.user.id, interaction.user.username);
  if (!dbUser.is_subscriber) {
    const lines: string[] = [];
    lines.push("**DIFFUSION.GG SUBSCRIPTION**")
    lines.push(" - Ability to toggle `/nsfw_filter` to view NSFW content")
    lines.push(" - 1710 user credits each month (1.5x better value than buying individually)");

    const subLink = await makeSubLink(interaction.user.id);

    const subrow = new ActionRowBuilder<ButtonBuilder>().addComponents([]);
    const subscribe = new ButtonBuilder()
      .setLabel(`SUBSCRIBE (1.5x CREDITS)`)
      .setURL(subLink.url)
      .setStyle(ButtonStyle.Link);
    subrow.addComponents(subscribe);

    const baseEmbed = {
      color: Colors.Blurple,
      title: "Subscribe to toggle NSFW Filter",
      description: lines.join("\n")
    };
    await interaction.editReply({ content: "", embeds: [baseEmbed], components: [subrow] });
    return;
  }

  await setNSFWFilter(dbUser.discord_id, nsfw_filter);

  await interaction.editReply(sexualContentMessage(nsfw_filter));
}
