import Jimp from "jimp";
import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SelectMenuInteraction, Colors } from "discord.js";
import "dotenv/config";
import * as Buttons from "./buttons";

export async function createCaptcha(userId: string) {
  const captcha = Math.random().toString(36).slice(2, 8);
  const image = new Jimp(175, 50, "black");
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const textWidth = Jimp.measureText(font, captcha);
  const textHeight = Jimp.measureTextHeight(font, captcha, width);
  image.print(font, width / 2 - textWidth / 2, height / 2 - textHeight / 2, captcha);
  image.write(`${__dirname}/captchas/${userId}_${captcha}.png`);
  return captcha;
}

//this list gets wiped after every bot restart
let infoUsersPressed: any[] = [];
//delete any now invalid captcha files to free up spcae upon bot start
// await fs.unlink(`${__dirname}/captchas/`)
//   .catch(error => console.log(error));

export async function sendCaptcha(
  interaction: ChatInputCommandInteraction<CacheType> | ButtonInteraction<CacheType> | SelectMenuInteraction<CacheType>,
) {
  const captcha = await createCaptcha(interaction.user.id);
  const baseEmbed = {
    color: Colors.Grey,
    title: "Captcha Verification",
    description: "Please type in and send the captcha.",
  };
  const message = await interaction.user
    .send({
      embeds: [baseEmbed],
      files: [
        {
          attachment: `${__dirname}/captchas/${interaction.user.id}_${captcha}.png`,
          name: `${interaction.user.id}_${captcha}.png`,
        },
      ],
    })
    .catch(() =>
      interaction.editReply({
        embeds: [baseEmbed],
        files: [
          {
            attachment: `${__dirname}/captchas/${interaction.user.id}_${captcha}.png`,
            name: `${interaction.user.id}_${captcha}.png`,
          },
        ],
      }),
    );
  try {
    //TODO: fix this message never working
    const filter = (message: any) => {
      if (message.author.id === interaction.user.id && message.content === captcha) {
        return true;
      } else {
        message.channel.send("You entered the captcha incorrectly. Try again.");
        return false;
      }
    };
    const response = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 60000,
      errors: ["time"],
    });
    if (response) {
      let userIdxPos: number = 0;
      if (
        infoUsersPressed.find((usersPressed, Idx) => {
          userIdxPos = Idx;
          return usersPressed.userId === interaction.user.id;
        })
      ) {
        infoUsersPressed.splice(userIdxPos, 1);
      }
      await message.channel.send("You have verified yourself! You can continue to use the bot normally.");
      // await fs.unlink(`${__dirname}/captchas/${interaction.user.id}_${captcha}.png`)
      //   .catch(error => console.log(error));
    }
  } catch (error) {
    console.log(error);
    // await fs.unlink(`${__dirname}/captchas/${interaction.user.id}_${captcha}.png`)
    //   .catch(error => console.log(error));
    await message.channel.send({
      content: "You did not solve the captcha correctly on time.",
      components: [Buttons.retryCaptchaRow(interaction)],
    });
  }
}
