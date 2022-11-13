import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  SelectMenuInteraction,
  Colors,
  Interaction,
  Role,
  ModalSubmitInteraction,
  APIEmbed,
  JSONEncodable,
} from "discord.js";
import "dotenv/config";
import {
  getDiscordUser,
  useDiscordCredit,
  createJob,
  getJob,
  DBJob,
  getQueueLength,
  getImages,
  setFirstMessageSent,
  getDiscordServer,
  DBDiscordServer,
  setJobMessageId,
  devCompleteJob,
  incrementImagesGenerated,
  canCreateNewJob,
  cleanupOldJobs,
  DBDiscordUser,
  devCompleteDescribeJob,
} from "../../rest/db";
import Stripe from "stripe";
import { getPromptSuffix } from "../../rest/static";
import * as Buttons from "./buttons";
import { getHelpEmbed } from "../lib/messages";
import { randomIntFromInterval } from "./utils";
import { makeBuyCreditsButtons } from "./payment";
import { discord_servers, discord_users, jobs } from "@prisma/client";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function indexOfMax(arr: number[]) {
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

export async function getDbServer(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ButtonInteraction<CacheType>
    | SelectMenuInteraction<CacheType>
    | ModalSubmitInteraction<CacheType>,
) {
  const inServer = interaction.guild !== null;
  let dbServer: discord_servers | null = null;
  if (inServer) {
    dbServer = await getDiscordServer(interaction.guild.id, interaction.guild.name);
  }
  return dbServer;
}

export function isDiffusionDiscord(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ButtonInteraction<CacheType>
    | SelectMenuInteraction<CacheType>
    | Interaction<CacheType>,
) {
  return interaction.guild?.id === "1013776797210517515" || interaction.guild?.id === "1013364951177498644"
    ? true
    : false;
}

//resets after every bot restart
let usersDrawn: any[] = [];
async function drew(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ButtonInteraction<CacheType>
    | SelectMenuInteraction<CacheType>
    | Interaction<CacheType>,
) {
  if (!isDiffusionDiscord(interaction)) return;
  let userIdxPos: number = 0;
  if (
    usersDrawn.find((user, Idx) => {
      userIdxPos = Idx;
      return user.userId === interaction.user.id;
    })
  ) {
    let pressed = usersDrawn[userIdxPos].pressed;
    if (pressed >= 50) {
      const member =
        interaction.guild?.members.cache.get(interaction.user.id) ||
        (await interaction.guild?.members.fetch(interaction.user.id).catch((err) => {}));
      const roleToGive = interaction.guild?.roles.cache.get("1020995638118330408") as Role;
      if (!roleToGive) return console.log("The role does not exist.");
      member?.roles.add(roleToGive).catch((error) => console.log(error));
    } else if (pressed >= 200) {
      const member =
        interaction.guild?.members.cache.get(interaction.user.id) ||
        (await interaction.guild?.members.fetch(interaction.user.id).catch((err) => {}));
      const roleToGive = interaction.guild?.roles.cache.get("1020995882805624912") as Role;
      if (!roleToGive) return console.log("The role does not exist.");
      member?.roles.add(roleToGive).catch((error) => console.log(error));
    } else {
      usersDrawn[userIdxPos].pressed += 1;
    }
  } else {
    usersDrawn.push({
      userId: interaction.user.id,
      pressed: 1,
      datePressed: Date.now(),
    });
  }
}

export type DiffusionInteraction =
  | ChatInputCommandInteraction<CacheType>
  | ButtonInteraction<CacheType>
  | SelectMenuInteraction<CacheType>
  | ModalSubmitInteraction<CacheType>;

type GenerateImageOptions = {
  interaction: DiffusionInteraction;
  prompt: string;
  prompt_engineer_seed?: number;
  prompt_engineer: boolean;
  negative_prompt: string;
  n_samples: number;
  ddim_steps: number;
  seed: number | null;
  img2img_strength?: number;
  reroll: boolean;
  style: string;
  discord_response?: string;
  is_draw_one?: boolean;
  width: number;
  height: number;
  image_url?: string;
  // guidance_scale
  scale: number;
  upscale: boolean;
  fix_faces: boolean;
  sampler: string;
  type: string;
  mask_mode?: "keep" | "replace";
  mask_prompt?: string;
};

type DescribeImageOptions = {
  interaction: DiffusionInteraction;
  img2prompt_url: string;
};

async function canRunTask(
  interaction: DiffusionInteraction,
  dbUser: discord_users,
  dbServer: discord_servers | null,
  credits: number,
): Promise<boolean> {
  const inServer = interaction.guild !== null;

  if (dbServer?.blocked) {
    const upgradeMessage = `Sorry your server has been blocked. Reason: ${dbServer.blocked_reason}. To appeal this ban join https://discord.gg/ZaEJxW4rU6`;
    await interaction.editReply(upgradeMessage);
    return false;
  }

  if (dbUser.blocked) {
    const upgradeMessage = `Sorry you have been blocked. Reason: ${dbUser.blocked_reason}. To appeal this ban join https://discord.gg/ZaEJxW4rU6`;
    await interaction.editReply(upgradeMessage);
    return false;
  }

  if (!dbUser.first_message_sent && process.env.STAGE === "prod") {
    await setFirstMessageSent(dbUser.id);
    await interaction.user.send({ embeds: getHelpEmbed() });
  }

  // lets only rate limit in diffusion.gg
  if (isDiffusionDiscord(interaction)) {
    const canMakeNewJob = await canCreateNewJob(interaction.user.id);
    if (!canMakeNewJob && !dbUser.is_subscriber) {
      const upgradeMessage = `<@${interaction.user.id}>, you can only use one command at a time. Please wait for your current job to finish.`;
      await interaction.editReply(upgradeMessage);
      return false;
    }
  }
  
  if (!isDiffusionDiscord(interaction) && !dbUser.is_subscriber) {
    const success = await useDiscordCredit(dbUser.id, dbServer?.id ?? null, credits);
    if (!success) {
      const baseEmbed = {
        color: Colors.Blurple,
        title: "You have hit your usage limit",
        description: `Each day you get 10 free credits.\nUse /credits to see when they refresh.`,
      }
    
      const addCreditsRows = await makeBuyCreditsButtons(interaction, dbUser, dbServer);
    
      await interaction.editReply({ content: "", embeds: [baseEmbed], components: [...addCreditsRows] });
      await interaction.user.send({ content: "https://discord.gg/ZaEJxW4rU6", embeds: [baseEmbed], components: [...addCreditsRows] });

      // const upgradeMessage = `<@${interaction.user.id}>, you have hit your daily usage limit.\nUse /credits to get more.\n`;
      // await interaction.editReply(upgradeMessage);
      
      return false;
    }
  }
  return true;
}

function getPriority(interaction: DiffusionInteraction) {
  if (isDiffusionDiscord(interaction)) {
    return -50;
  }
  return 0;
}

export async function generateImg2Prompt(options: DescribeImageOptions) {
  console.log("[DESCRIBE]: ", options.img2prompt_url);
  const { interaction, img2prompt_url } = options;

  const dbUser = await getDiscordUser(interaction.user.id, interaction.user.username);
  const dbServer = await getDbServer(interaction);

  // NOTE: Sideeffect heavy function that wraps a ton of shit (credits, subscription, replying to interaction, etc).
  //       Be careful when modifying.
  //       If this returns FALSE the interaction is dead
  if (!(await canRunTask(interaction, dbUser, dbServer, 1))) {
    return;
  }

  await interaction.editReply("Describing image (waiting...)");

  const jobId = await createJob({
    type: "img2prompt",
    img2prompt_url: img2prompt_url,
    discord_user: interaction.user.id,
    discord_name: interaction.user.username,
    user_id: dbUser.id,
    discord_server_id: interaction.guild?.id,
    discord_server_name: interaction.guild?.name,
    server_id: dbServer ? dbServer.id : undefined,
  }, getPriority(interaction));

  if (process.env.STAGE === "dev") {
    await devCompleteDescribeJob(jobId);
  } else {
    await sleep(6);
  }

  let job = await getJob(jobId);
  let prevTotal = 999999999999999;
  let prevPos = 999999999999999;
  let i = 0;
  await cleanupOldJobs();
  do {
    if (i > 100) {
      await interaction.editReply(`Describing image (timed out... please try again!)`);
      return;
    }

    await sleep(2500);
    job = await getJob(jobId);
    if (!job) {
      await interaction.editReply(`Describing image (timed out... please try again!)`);
      return;
    }

    const { total, position } = await getQueueLength(job.created_at, job.prio);
    if (total !== prevTotal || position !== prevPos) {
      if (position === 0) {
        await interaction.editReply(`Describing image (running...)`);
      } else {
        await interaction.editReply(`Describing image (position ${position})`);
      }
    }
    prevTotal = total;
    prevPos = position;

    i += 1;
  } while (!job.done);

  // console.log(job);
  // console.log(job.results);
  // console.log(job.results.prompt);
  const baseEmbed = {
    color: job.results?.prompt ? Colors.Blurple : Colors.Red,
    title: job.results?.prompt ? "Image Described" : "Describe Failed",
    url: options.img2prompt_url ? options.img2prompt_url : "",
    image: {
      url: options.img2prompt_url ? options.img2prompt_url : "",
    },
    description: job.results.prompt ? job.results.prompt : "",
  };
  await interaction.editReply(`Describing image (done)`);
  await interaction.followUp({
    content: `<@${interaction.user.id}>`,
    embeds: [baseEmbed],
  });
}

export async function generateImage(options: GenerateImageOptions) {
  console.log("[GENERATE]", { ...options, interaction: undefined });
  const { interaction, prompt, prompt_engineer_seed, n_samples, ddim_steps, seed, reroll, style, img2img_strength, sampler, type, prompt_engineer } = options;
  let { discord_response } = options;
  if (!discord_response) {
    discord_response = prompt;
  }

  const seedToUse = seed !== null ? seed : 42;

  const dbUser = await getDiscordUser(interaction.user.id, interaction.user.username);
  const dbServer = await getDbServer(interaction);

  // NOTE: Sideeffect heavy function that wraps a ton of shit (credits, subscription, etc).
  //       Be careful when modifying.
  //       If this returns FALSE the interaction is dead
  if (!(await canRunTask(interaction, dbUser, dbServer, n_samples))) {
    return;
  }
  const styleString = style !== "none" ? ` [${style}]` : "";
  // const engineeredPromptNotify = prompt_engineer === true || prompt_engineer_seed != undefined ? " [Prompt Enhancer]" : ""
  const replyBase = `\`${discord_response}${styleString}\` - <@${interaction.user.id}>`;
  await interaction.editReply(replyBase + " (waiting...)");

  const addStyle = `${prompt}${getPromptSuffix(style)}`;

  // await checkNsfl(prompt, `${interaction.user.username} - ${interaction.guild?.name}`, false);

  await incrementImagesGenerated(dbUser.id);
  const jobId = await createJob({
    raw_prompt: prompt,
    prompt: addStyle,
    prompt_engineer: prompt_engineer,
    prompt_engineer_seed: prompt_engineer_seed,
    style,
    ddim_steps,
    n_samples,
    width: options.width,
    height: options.height,
    seed: seedToUse,
    type: type,
    discord_user: interaction.user.id,
    discord_name: interaction.user.username,
    user_id: dbUser.id,
    discord_server_id: interaction.guild?.id,
    discord_server_name: interaction.guild?.name,
    server_id: dbServer ? dbServer.id : undefined,
    discord_response: discord_response,
    img2img_url: options.image_url,
    img2img_strength: options.img2img_strength,
    scale: options.scale,
    negative_prompt: options.negative_prompt ?? "",
    upscale: options.upscale,
    fix_faces: options.fix_faces,
    sampler: options.sampler,
    mask_mode: options.mask_mode,
    mask_prompt: options.mask_prompt,
  }, getPriority(interaction));

  if (process.env.STAGE === "dev") {
    await devCompleteJob(jobId);
  } else {
    await sleep(6);
  }

  let job = await getJob(jobId);

  let prevTotal = 999999999999999;
  let prevPos = 999999999999999;
  let i = 0;
  await cleanupOldJobs();
  do {
    if (i > 100) {
      await interaction.editReply(`${replyBase} (timed out... please try again!)`);
      return;
    }

    await sleep(2500);
    job = await getJob(jobId);
    if (!job) {
      await interaction.editReply(`${replyBase} (timed out... please try again!)`);
      return;
    }

    const { total, position } = await getQueueLength(job.created_at, job.prio);
    if (total !== prevTotal || position !== prevPos) {
      if (position === 0) {
        await interaction.editReply(`${replyBase} (running...)`);
      } else {
        await interaction.editReply(`${replyBase} (position ${position})`);
      }
    }
    prevTotal = total;
    prevPos = position;

    i += 1;
  } while (!job.done);

  const images = await getImages(jobId);
  if (!images || images.length === 0) {
    await interaction.editReply(
      `Sorry! Something went wrong, if you are using a starting image make sure it has 512x512 dimensions`,
    );
    return;
  }
  const imageUrls = images.map((img) => img.uri) as string[];
  const imageNSFW = images.map((img) => img.nsfw);

  //console.log(results);
  // console.log(imageUrls);

  const shortcutsRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
    Buttons.likeButton,
    Buttons.curseButton,
    Buttons.flagButton,
  ]);

  const infoRow = new ActionRowBuilder<ButtonBuilder>().addComponents([Buttons.infoButton]);

  const components: any = [];
  if (isDiffusionDiscord(interaction)) {
    components.push(shortcutsRow);
  }
  components.push(Buttons.tweakingRow);
  components.push(infoRow);

  const embeds = imageUrls.map((img, idx) => {
    let blocked = false;
    if (dbUser.nsfw_filter) {
      blocked = imageNSFW[idx];
    }
    
    if (blocked) {
      return {
        color: Colors.Blurple,
        description:
          "This image has been blocked because it was detected to be **NSFW Content**.\nA Diffusion.gg subscription is required to view NSFW content.\nUse \`/credits`\ for more info.",
      };
    }

    return {
      color: Colors.Blurple,
      image: {
        url: img,
      },
    };
  });
  if (options.image_url) {
    const baseEmbed = {
      color: Colors.Blurple,
      title: options.image_url ? "Initial Image" : "",
      url: options.image_url ? options.image_url : "",
      description: "",
    };
    embeds.unshift(baseEmbed);
  }

  const followup = await interaction.followUp({
    content: replyBase,
    components: components,
    embeds: embeds,
  });
  // await drew(interaction);
  await setJobMessageId(job.id, followup.id);
  await interaction.editReply(`${replyBase} (done)`);
}
