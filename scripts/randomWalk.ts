import fetch from "node-fetch";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function processTask(body: any) {
  const response = await fetch("https://diffusion-gg.fly.dev/jobs", {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "diffusion-secret": "a6677c01-3850-4adf-908a-29209d21b0b0",
    },
  });
  const data = await response.json();
  console.log(data);
  return data;
}

const guidanceScaleChoices = [
    {
      name: "Let the AI take control (4)",
      value: 4,
    },
    {
      name: "Let's work together (8)",
      value: 8,
    },
    {
      name: "Please listen to my prompt (12)",
      value: 12,
    },
    {
      name: "FOLLOW MY PROMPT OR ELSE (16) (default)",
      value: 16,
    },
  ];
  
  const samplerChoices = [
    {
      name: "plms",
      value: "plms",
    },
    {
      name: "ddim",
      value: "ddim",
    },
    {
      name: "k_lms",
      value: "k_lms",
    },
    {
      name: "k_dpm_2",
      value: "k_dpm_2",
    },
    {
      name: "k_dpm_2_a",
      value: "k_dpm_2_a",
    },
    {
      name: "k_euler (default)",
      value: "k_euler",
    },
    {
      name: "k_euler_a",
      value: "k_euler_a",
    },
    {
      name: "k_heun",
      value: "k_heun",
    },
  ];
  

// raw_prompt: prompt,
//     prompt: addStyle,
//     prompt_engineer: prompt_engineer,
//     prompt_engineer_seed: prompt_engineer_seed,
//     style,
//     ddim_steps,
//     n_samples,
//     width: options.width,
//     height: options.height,
//     seed: seedToUse,
//     type: type,
//     discord_user: interaction.user.id,
//     discord_name: interaction.user.username,
//     user_id: dbUser.id,
//     discord_server_id: interaction.guild?.id,
//     discord_server_name: interaction.guild?.name,
//     server_id: dbServer ? dbServer.id : undefined,
//     discord_response: discord_response,
//     img2img_url: options.image_url,
//     img2img_strength: options.img2img_strength,
//     scale: options.scale,
//     negative_prompt: options.negative_prompt ?? "",
//     upscale: options.upscale,
//     fix_faces: options.fix_faces,
//     sampler: options.sampler,
//     mask_mode: options.mask_mode,
//     mask_prompt: options.mask_prompt,

function generateRandomPrompts(prompt: string, seed: number, experiment_id: string) {
    const prompts: any[] = [];

    // 32
    for (let i = 0; i < 16; i++) {
        let newSeed = seed + (i * 4);
        // 4
        for (const scale of guidanceScaleChoices) {
            // 8
            for (const sampler of samplerChoices) {
                prompts.push({
                    prompt,
                    prompt_engineer: true,
                    prompt_engineer_seed: newSeed,
                    seed: newSeed,
                    n_samples: 4,
                    sampler: sampler.value,
                    ddim_steps: 32,
                    scale: scale.value,
                    experiment_id,
                    type: "txt2img",
                    prio: -1
                })
            }
        }

    }

    return prompts;
    

}

async function main() {
    const res = generateRandomPrompts("virus monster", 42, "virus_monster_real");
    for (let i = 0; i < res.length; i++) {
      const response = await processTask(res[i]);
      console.log(response);
      await sleep(200)
    }


//   queue.start();
//   await queue.onEmpty();
}

main();