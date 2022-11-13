import { ButtonInteraction, CacheType, Colors } from "discord.js";
import { getJobByMessageId } from "../../../rest/db";
import { isDiffusionDiscord } from "../../lib/diffusion";

export async function processInfo(interaction: ButtonInteraction<CacheType>) {
  console.log(`[INFO]: info, msg_id: ${interaction.message.id}`);
  const job = await getJobByMessageId(interaction.message.id);
  console.log(`[INFO]: info, job_id: ${job && job.id}`);
  await interaction.deferReply({ ephemeral: true });
  if (!job) {
    await interaction.editReply("Sorry! An unknown error occured.");
    return;
  }

  //code for the captcha and rate limiter on info button

  // let userIdxPos: number = 0;
  // if (infoUsersPressed.find((usersPressed, Idx) => {
  //   userIdxPos = Idx;
  //   return usersPressed.userId === interaction.user.id
  // })) {
  //   let hours = Math.abs(infoUsersPressed[userIdxPos].datePressed - Date.now()) / 36e5;
  //   console.log(hours)
  //   if (hours >= 24) {
  //     infoUsersPressed[userIdxPos].pressed = 1;
  //     infoUsersPressed[userIdxPos].datePressed = Date.now();
  //   }
  //   else {
  //     let pressed = infoUsersPressed[userIdxPos].pressed
  //     if (pressed >= 10) {
  //       await interaction.editReply("Please verify if you are human by completing the captcha we sent.");
  //       return await sendCaptcha(interaction);
  //     } else {
  //       infoUsersPressed[userIdxPos].pressed += 1;
  //     }
  //   }
  //   console.log(infoUsersPressed[userIdxPos])
  // }
  // else {
  //   infoUsersPressed.push({
  //     userId: interaction.user.id,
  //     pressed: 1,
  //     datePressed: Date.now(),
  //   })
  // }

  function checkValueInvalid(value: string) {
    if (value == "none" || value == null || value == "null" || value == "undefined" || value == "") return true;
    else return false;
  }

  let techInfoEmbed = {
    title: "Generation Information",
    color: Colors.Blurple,
    url: interaction.message.url,
    fields: [
      {
        name: "Technicalities",
        value:
          "seed: " +
          (checkValueInvalid(job.args.seed) ? "null\n" : `${job.args.seed}\n`) +
          (job.args.prompt_engineer ? `enhanced prompt: ${job.args.prompt_engineer}\n` : "") +
          (job.args.prompt_engineer ? `enhanced prompt seed: ${job.args.prompt_engineer_seed}\n` : "") +
          (checkValueInvalid(job.args.style) ? "" : `style: ${job.args.style}\n`) +
          (checkValueInvalid(job.args.ddim_steps) ? "" : `steps: ${job.args.ddim_steps}\n`) +
          (checkValueInvalid(job.args.sampler) ? "" : `sampler: ${job.args.sampler}\n`) +
          (checkValueInvalid(job.args.scale) ? "" : `guidance: ${job.args.scale}\n`),
        inline: true,
      },
      {
        name: "Author",
        value: checkValueInvalid(job.args.discord_user) ? "no author" : `<@${job.args.discord_user}>`,
        inline: true,
      },
      {
        name: "Image",
        value:
          "width: " +
          (checkValueInvalid(job.args.width) ? "null\n" : `${job.args.width}\n`) +
          ("height: " + (checkValueInvalid(job.args.height) ? "null\n" : `${job.args.height}\n`)) +
          (checkValueInvalid(job.args.img2img_url) ? "" : `initial image: [image](${job.args.img2img_url})\n`) +
          (checkValueInvalid(job.args.img2img_strength) ? "" : `strength: ${job.args.img2img_strength}\n`) +
          (checkValueInvalid(job.args.upscale) ? "" : `upscale: ${job.args.upscale}\n`) +
          (checkValueInvalid(job.args.fix_faces) ? "" : `fix face: ${job.args.fix_faces}\n`),
        inline: false,
      },
      {
        name: "Prompt",
        value:
          (checkValueInvalid(job.args.raw_prompt) ? "no prompt" : `\`${job.args.raw_prompt}\``) +
          (checkValueInvalid(job.args.negative_prompt) ? "" : `\nnegative prompt: \`${job.args.negative_prompt}\``),
        inline: false,
      },
    ],
  };

  let buttonInfoEmbed = {
    color: Colors.Blurple,
    fields: [
      {
        name: "What do the buttons do?",
        value:
          "🔁 - repeat the generation\n🎨 - change output images' style\n✨ - refine images for more detail\n" +
          (isDiffusionDiscord(interaction)
            ? "❤️ - send image to gallery\n💀 - send image to curse channel\n⚠️ - report image to moderators"
            : ""),
        inline: true,
      },
    ],
  };

  await interaction.editReply({ embeds: [techInfoEmbed, buttonInfoEmbed] });
}
