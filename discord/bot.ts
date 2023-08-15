import * as Sentry from "@sentry/node";
import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { processCredits } from "./api/actions/credits";
import { processDescribe } from "./api/actions/describe";
import { processDraw } from "./api/actions/draw";
import { processInfo } from "./api/actions/info";
import { processMaskImage } from "./api/actions/mask";
import { processRefine } from "./api/actions/refine";
import { processReport } from "./api/actions/report";
import { processReroll } from "./api/actions/reroll";
import { processShowcase } from "./api/actions/showcase";
import { processStyle } from "./api/actions/style";
import { processNSFWFilter } from "./api/admin/nsfwFilter";
import { processFlaggedRow } from "./api/internal/flaggedRow";
import { selectImageMenu } from "./api/menus/imageMenu";
import { selectMaskModal } from "./api/menus/maskModal";
import { selectRefineMenu } from "./api/menus/refineMenu";
import { selectStyleMenu } from "./api/menus/styleMenu";
import { getHelpEmbed, promptGuideEmbed } from "./lib/messages";
import { Router } from "./lib/router";

const router = new Router();

// row 1
router.button("like_choose_img", (interaction) => selectImageMenu(interaction));
router.button("curse_choose_img", (interaction) => selectImageMenu(interaction));
router.button("report", (interaction) => processReport(interaction));

// row 2
router.button("reroll", (interaction) => processReroll(interaction));
router.button("style_change", (interaction) => selectStyleMenu(interaction));
router.button("refine_choose_img", (interaction) => selectImageMenu(interaction));

// row 3
router.button("info", (interaction) => processInfo(interaction));

// The 4 refine options after refine_choose_img
router.buttonStartsWith("option_variate", (interaction) => processRefine(interaction));
router.buttonStartsWith("option_upscale", (interaction) => processRefine(interaction));
router.buttonStartsWith("option_fix_face", (interaction) => processRefine(interaction));
router.buttonStartsWith("option_mask", (interaction) => selectMaskModal(interaction));

// The two button options after report
router.buttonStartsWith("delete_flagged", (interaction) => processFlaggedRow(interaction, false));
router.buttonStartsWith("delete_false_flagged", (interaction) => processFlaggedRow(interaction, true));

// Refine, Like, Select and Curse handlers after image selection/options
router.selectStartsWith("style", (interaction) => processStyle(interaction));
router.buttonStartsWith("refine", (interaction) => selectRefineMenu(interaction));
router.buttonStartsWith("like", (interaction) =>
  processShowcase(
    interaction,
    process.env.DISCORD_LIKE_CHANNEL_ID as string,
    "❤️",
    "View your favorited piece in the gallery!",
    "favorited",
  ),
);
router.buttonStartsWith("curse", (interaction) =>
  processShowcase(
    interaction,
    process.env.DISCORD_CURSED_CHANNEL_ID as string,
    "💀",
    "View your cursed piece in the gallery!",
    "cursed",
  ),
);

router.modalStartsWith("mask_modal", (interaction) => processMaskImage(interaction));

router.chat("nsfw_filter", (interaction) => processNSFWFilter(interaction));
router.chat("help", async (interaction) => {
  await interaction.reply({ embeds: getHelpEmbed() });
  return;
});
router.chat("prompt_guide", async (interaction) => {
  await interaction.reply({ embeds: promptGuideEmbed() });
  return;
});
router.chat("prompt_guide", (interaction) => processNSFWFilter(interaction));
router.chat("draw", (interaction) => processDraw(interaction, "draw"));
router.chat("draw_one", (interaction) => processDraw(interaction, "draw_one"));
router.chat("describe", (interaction) => processDescribe(interaction));
router.chat("credits", (interaction) => processCredits(interaction));

const client = new Client({ intents: [GatewayIntentBits.Guilds], shards: "auto" });

client.once("ready", () => {
  client.user?.setActivity("/draw");
  console.log("Discord: Ready!");
});

client.on("interactionCreate", async (interaction) => {
  try {
    await router.execute(interaction);
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
  }
});

export async function start() {
  await client.login(process.env.DISCORD_TOKEN);
}
