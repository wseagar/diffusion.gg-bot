import { Colors } from "discord.js";

export function promptGuideEmbed() {
    return [
        {
            title: "Prompt Guide",
            description: "You can use anything as a prompt but there are a few tips and tricks to get better images.",
            color: Colors.Blurple,
            fields: [
                {
                    name: "Do:",
                    value: 
                        "```"
                        + `- include a concrete subject. eg: "A robot", "A banana", "Spain", "A girl with fire coming out of her eyes"`
                        + `\n- ask a question. eg "What should I eat for lunch?", "Where should I go travel?"`
                        + `\n- being as specific as possible gives better results`
                        + `\n- use the prebuilt style modifiers to enhance your results.`
                        + `\n- click 🔁 to generate different images with the same prompt.`
                        + `\n- "{character} as {another character} in {...}" works well eg: "Kayne West as Tyrion Lanister in Game Of Thrones"`
                        + "```",
                    inline: false,
                },
                {
                    name: "Don't:",
                    value: 
                        "```"
                        + `\n- abstract concepts will not give good results. eg: "the economy"`
                        + `\n- questions with abstract answers will not give good results. eg "what is the meaning of life?"`
                        + `\n- words are almost never rendered correctly. eg: "A sign with the word Diffusion.gg on it"`
                        + "```",
                    inline: false,
                },
                {
                    name: "Examples:",
                    value: 
                        "```"
                        + "\n- A robot, digital art, clean white background, trending on artstation"
                        + "\n- A kitten, studio photography, playing with a ball, 50mm camera"
                        + "\n- A beautiful landscape, studio ghibli, pink flowers, 2d game art"
                        + "\n```"
                        + "\nYou can also ask questions with \`/draw\`"
                        + "\n\nSome examples:"
                        + "```"
                        + "\n- What should I have for lunch?"
                        + "\n- Where should I go travel?"
                        + "\n- What does the dark side of the moon look like?"
                        + "```",
                    inline: false,
                },
                {
                    name: "Templates:",
                    value: 
                        "A good prompt structure to start experimenting with is:"
                        + "\n`{subject}, {style}, {details}, {modifiers}`"
                        + "\n```"
                        + "\n- GTA V cover character: [subject] in GTA V, cover art by Stephen Bliss, artstation"
                        + "\n- Quick photorealism (NOP#1337) : [prompt], Canon EOS R3, f/1.4, ISO 200, 1/160s, 8K, RAW, unedited, symmetrical balance, in-frame"
                        + "\n- Film character (richservo#8465) : film still of [character] [action] in [movie], 4k"
                        + "\n- Real life cartoon character (richservo#8465) : portrait photo still of real life [character], 8k, 85mm f1.8"
                        + "\n- Dish picture (richservo#8465): DSLR food photograph of [dish description], 85mm f1.8"
                        + "\n- Muppet portrait (richservo#8465): studio portrait still of muppet !!!!![person or character] !!!!!! as a muppet muppet as a muppet, 8k, studio lighting, key light"
                        + "```",
                    inline: false,
                },
            ],
        },
    ];
}

export function getHelpEmbed() {
    return [
        {
            title: "Getting Started",
            description: 
            `Welcome to Diffusion.gg! 
            Diffusion.gg is a stable diffusion discord bot.`,
            color: Colors.Blurple,
            fields: [
                {
                    name: "Prompt Guide",
                    value: 
                        "Use `/prompt_guide` to learn how to write better prompts!",
                    inline: false,
                },
                {
                    name: "Commands",
                    value: 
                        `\`/draw\`: Creates 2 images from text with menus
                        \`/draw_one\`: Creates 1 image from text without menus
                        \`/describe\`: Get a prompt back from a image
                        \`/prompt_guide\`: Learn how to write better prompts
                        \`/help\`: Shows this menu
                        \`/credits\`: Shows how many draw commands you have left && manage subscription`,
                        
                    inline: false,
                },
                {
                    name: "Subscriber Commands",
                    value: 
                        `\`/nsfw_filter\`: Change your NSFW filter settings`,
                    inline: false,
                },
                {
                    name: "Usage",
                    value: 
                        `You have 20 free draw commands, then are given 5 extra \`/draw\` commands per day.`,
                    inline: false,
                },
                {
                    name: "Support",
                    value: 
                        `If you need any help or support, don't hesitate to join our [discord server](https://discord.gg/ZaEJxW4rU6).`,
                    inline: false,
                },
            ],
        },
    ];
}

export function sexualContentMessage(nsfw_filter: boolean) {
  return `Your NSFW filter settings have been updated. NSFW content is now ${nsfw_filter ? "hidden" : "visible"}.`;
}

export const paidMessage = `Upgrade to a paid plan to get unlimited use and other features.\n\nTo view more details use the \`/subscribe\` command.`;
