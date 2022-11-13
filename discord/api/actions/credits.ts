import {
  ChatInputCommandInteraction,
  CacheType,
  Colors
} from "discord.js";
import { getDiscordUser } from "../../../rest/db";
import { intervalToDuration, formatDuration, addHours, isAfter } from "date-fns";
import { makeBuyCreditsButtons } from "../../lib/payment";
import { getDbServer, isDiffusionDiscord } from "../../lib/diffusion";
import { Prisma } from "@prisma/client";



export async function processCredits(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply("Retrieving credits...");

  const dbServer = await getDbServer(interaction);
  let dbUser = await getDiscordUser(interaction.user.id, interaction.user.username);
  let lastReplenishDate = new Date(new Date(dbUser["free_credits_timestamp"]).getTime());
  let nextReplenishDate = addHours(lastReplenishDate, 24);

  const result = intervalToDuration({
    start: new Date(Date.now()),
    end: new Date(nextReplenishDate),
  });

  const showFooter = isAfter(nextReplenishDate, new Date()) && dbUser.user_credits.lessThan(new Prisma.Decimal(10));

  const lines = [
    `You have \`${dbUser["user_credits"]}\` user credits left`,
  ]

  if (isDiffusionDiscord(interaction)) {
    lines.push(`This server has unlimited server credits`)
  } else if (dbServer) {
    lines.push(`This server has \`${dbServer?.server_credits}\` server credits left`)
  }
  // can be in a DM then pushing no line


  lines.push(`\`1\` credit = \`1\` image`)
  lines.push(``);

  if (!dbUser.stripe_customer_id) {
  } else {
    lines.push("**DIFFUSION.GG SUBSCRIPTION**")
    lines.push("You are currently subscribed")
  }

  const baseEmbed = {
    color: Colors.Blurple,
    title: "Credits",
    description: lines.join("\n"),
    footer: showFooter
      ? {
          text: `Free 10 credits in ${formatDuration(result)}`,
        }
      : undefined,
  };

  const addCreditsRows = await makeBuyCreditsButtons(interaction, dbUser, dbServer);

  await interaction.editReply({ content: "", embeds: [baseEmbed], components: [...addCreditsRows] });
}
