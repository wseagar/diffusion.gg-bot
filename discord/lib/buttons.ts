import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ButtonInteraction,
  SelectMenuInteraction,
  CacheType,
} from "discord.js";

//Discord supports emoji's ID alternatively for custom server emojis
//f.e .setEmoji("1018449120962297876")
//using system emojis to identify code by glancing

export const likeButton = new ButtonBuilder()
  .setCustomId("like_choose_img")
  .setEmoji("❤️")
  .setStyle(ButtonStyle.Secondary);

export const curseButton = new ButtonBuilder()
  .setCustomId("curse_choose_img")
  .setEmoji("💀")
  .setStyle(ButtonStyle.Secondary);

export const flagButton = new ButtonBuilder().setCustomId("report").setEmoji("⚠️").setStyle(ButtonStyle.Danger);

export const infoButton = new ButtonBuilder()
  .setCustomId("info")
  .setLabel("ㅤㅤㅤㅤInformationㅤㅤㅤㅤ")
  .setStyle(ButtonStyle.Secondary);

export const tweakingRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
  new ButtonBuilder().setCustomId("reroll").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId("style_change").setLabel("🎨").setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId("refine_choose_img").setLabel("✨").setStyle(ButtonStyle.Secondary),
]);

export function createFlaggedForReviewRow(messageId: string, channelId: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents([
    new ButtonBuilder()
      .setCustomId(`delete_flagged|${messageId}|${channelId}`)
      .setLabel("Delete Post")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`delete_false_flagged|${messageId}|${channelId}`)
      .setLabel("False Flag")
      .setStyle(ButtonStyle.Secondary),
  ]);
}

export function retryCaptchaRow(
  interaction: ChatInputCommandInteraction<CacheType> | ButtonInteraction<CacheType> | SelectMenuInteraction<CacheType>,
) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents([
    new ButtonBuilder()
      .setCustomId(`captcha_retry|${interaction.user.id}`)
      .setLabel("Retry Captcha")
      .setStyle(ButtonStyle.Secondary),
  ]);
}
