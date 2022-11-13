// galactus the all knowing user service gpu service provider
import "dotenv/config";
import { CacheType, Client, GatewayIntentBits, Interaction } from "discord.js";
import fetch from "node-fetch";
import { pool } from "./rest/db";

const API_KEY = process.env.RUNPOD_API_KEY;

if (!API_KEY) {
  throw Error("Missing RUNPOD_API_KEY");
}

async function gql(query: any) {
  const response = await fetch("https://api.runpod.io/graphql?api_key=" + API_KEY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(query),
  });

  if (response.ok) {
    const out = await response.json();
    console.log(JSON.stringify(out, undefined, 2));
    return out;
  }
  const text = await response.text();
  console.log(text);
  throw Error(`[${response.status}]: ${text}`);
}

export type GetPodsResponse = {
  data: {
    myself: {
      id: string;
      pods: Array<{
        id: string;
        version: number;
        machineId: string;
        name: string;
        dockerId: any;
        dockerArgs: string;
        imageName: string;
        port: any;
        ports: string;
        podType: string;
        gpuCount: number;
        vcpuCount: number;
        containerDiskInGb: number;
        memoryInGb: number;
        volumeInGb: number;
        volumeMountPath: string;
        desiredStatus: string;
        uptimeSeconds: number;
        costPerHr: number;
        env: Array<string>;
        lastStatusChange: string;
        containerRegistryAuthId: any;
        volumeEncrypted: boolean;
        runtime: {
          uptimeInSeconds: number;
          gpus: Array<{
            id: string;
            gpuUtilPercent: number;
            memoryUtilPercent: number;
          }>;
        };
        machine: {
          gpuDisplayName: string;
          maxDownloadSpeedMbps: number;
          maxUploadSpeedMbps: number;
          diskMBps: number;
          podHostId: string;
          costPerHr: number;
          gpuAvailable: number;
          supportPublicIp: boolean;
          secureCloud: boolean;
          currentPricePerGpu: number;
          __typename: string;
        };
        __typename: string;
      }>;
      __typename: string;
    };
  };
};

const stopPodGql = `mutation stopPod($input: PodStopInput!) {
    podStop(input: $input) {
      id
      desiredStatus
      lastStatusChange
      __typename
    }
  }`;

const startPodGql = `mutation resume_pod($input: PodResumeInput!) {\n  podResume(input: $input) {\n    id\n    gpuCount\n    vcpuCount\n    memoryInGb\n    desiredStatus\n    costPerHr\n    lastStatusChange\n    __typename\n  }\n}`;

const fetchPodsGql = {
  query:
    "query myPods {\n" +
    "  myself {\n" +
    "    id\n" +
    "    pods {\n" +
    "      id\n" +
    "      version\n" +
    "      machineId\n" +
    "      name\n" +
    "      dockerId\n" +
    "      dockerArgs\n" +
    "      imageName\n" +
    "      port\n" +
    "      ports\n" +
    "      podType\n" +
    "      gpuCount\n" +
    "      vcpuCount\n" +
    "      containerDiskInGb\n" +
    "      memoryInGb\n" +
    "      volumeInGb\n" +
    "      volumeMountPath\n" +
    "      desiredStatus\n" +
    "      uptimeSeconds\n" +
    "      costPerHr\n" +
    "      env\n" +
    "      lastStatusChange\n" +
    "      containerRegistryAuthId\n" +
    "      volumeEncrypted\n" +
    "      runtime {\n" +
    "          uptimeInSeconds\n" +
    "          gpus {\n" +
    "            id\n" +
    "            gpuUtilPercent\n" +
    "            memoryUtilPercent\n" +
    "          }\n" +
    "      }\n" +
    "      machine {\n" +
    "        gpuDisplayName\n" +
    "        maxDownloadSpeedMbps\n" +
    "        maxUploadSpeedMbps\n" +
    "        diskMBps\n" +
    "        podHostId\n" +
    "        costPerHr\n" +
    "        gpuAvailable\n" +
    "        supportPublicIp\n" +
    "        secureCloud\n" +
    "        currentPricePerGpu\n" +
    "        __typename\n" +
    "      }\n" +
    "      __typename\n" +
    "    }\n" +
    "    __typename\n" +
    "  }\n" +
    "}",
};

async function getPods() {
  const pods = (await gql(fetchPodsGql)) as GetPodsResponse;
  return pods;
}

async function stopPod(pod_id: string) {
  const response = await gql({
    operationName: "stopPod",
    query: stopPodGql,
    variables: {
      input: {
        podId: pod_id,
      },
    },
  });
  return {
    id: response.data.podStop.id,
    desiredStatus: response.data.podStop.desiredStatus,
  };
}

async function startPod(pod_id: string) {
  const response = await gql({
    operationName: "resume_pod",
    query: startPodGql,
    variables: {
      input: {
        podId: pod_id,
        gpuCount: 1,
      },
    },
  });
  return {
    id: response.data.podResume.id,
    desiredStatus: response.data.podResume.desiredStatus,
  };
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once("ready", () => {
  console.log("Galactus: Ready!");
});

client.on("guildCreate", (guild) => {});

function round2dp(number: number) {
  return Math.round(number * 100) / 100;
}

function postgresDateThingToSeconds(obj: any) {
  if (!obj) {
    return 0;
  }
  let output = 0;
  if (obj.days) {
    output += obj.days * 86400;
  }
  if (obj.hours) {
    output += obj.hours * 3600;
  }
  if (obj.minutes) {
    output += obj.minutes * 60;
  }
  if (obj.seconds) {
    output += obj.seconds;
  }
  if (obj.milliseconds) {
    output += obj.milliseconds / 1000;
  }
  return output;
}

async function handleInteraction(interaction: Interaction<CacheType>) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  console.log(interaction);

  const { commandName } = interaction;

  if (commandName === "birthday") {
    await interaction.reply(
      "We're blocked ok. You sad pathetic little product manager. You think you know what our users want? You know nothing of my pain... Of Galactus' pain.  You think you know what it takes... To tell the user its his birthday? You know nothing.",
    );
  }

  if (commandName === "start") {
    await interaction.deferReply();
    let pod_id = interaction.options.getString("pod_id");
    console.log(pod_id);
    if (!pod_id) {
      // never happening
      return;
    }
    const response = await startPod(pod_id);
    await interaction.editReply(`Starting pod: ${response.id}`);
  }

  if (commandName === "terminate") {
    await interaction.deferReply();
    let pod_id = interaction.options.getString("pod_id");
    if (!pod_id) {
      return;
    }

    const response = await gql({
      operationName: "terminatePod",
      variables: { input: { podId: pod_id } },
      query: "mutation terminatePod($input: PodTerminateInput!) {\n  podTerminate(input: $input)\n}",
    });
    console.log(JSON.stringify(response));
    await interaction.editReply("Terminated " + pod_id);
  }

  if (commandName === "launch") {
    let gpu_id = interaction.options.getString("gpu_id");
    console.log(gpu_id);
    if (!gpu_id) {
      // never happening
      return;
    }

    await interaction.deferReply();
    const response = await gql({
      operationName: "GpuTypes",
      variables: {},
      query:
        "query GpuTypes {\n  gpuTypes {\n    maxGpuCount\n    id\n    displayName\n    memoryInGb\n    secureCloud\n    communityCloud\n    __typename\n  }\n}",
    });
    const gpu = response.data.gpuTypes.find((gpu: any) => gpu.id === gpu_id);
    if (!gpu) {
      await interaction.editReply("Failed to find GPU");
      return;
    }
    const details = await gql({
      operationName: "GpuTypes",
      variables: {
        gpuTypesInput: { id: gpu.id },
        lowestPriceInput: {
          gpuCount: 1,
          minMemoryInGb: gpu.memoryInGb,
          minVcpuCount: 2,
          secureCloud: false,
        },
      },
      query:
        "query GpuTypes($lowestPriceInput: GpuLowestPriceInput, $gpuTypesInput: GpuTypeFilter) {\n  gpuTypes(input: $gpuTypesInput) {\n    lowestPrice(input: $lowestPriceInput) {\n      minimumBidPrice\n      uninterruptablePrice\n      minVcpu\n      minMemory\n      __typename\n    }\n    maxGpuCount\n    id\n    displayName\n    memoryInGb\n    __typename\n  }\n}",
    });

    //                 "lowestPrice": {
    //                     "minimumBidPrice": 0.125,
    //                     "uninterruptablePrice": 0.21,
    //                     "minVcpu": 10,
    //                     "minMemory": 15,
    //                     "__typename": "LowestPrice"
    //                 },
    //                 "maxGpuCount": 4,
    //                 "id": "NVIDIA GeForce RTX 3080",
    //                 "displayName": "RTX 3080",
    //                 "memoryInGb": 10,
    //                 "__typename": "GpuType"
    //

    const info = details.data.gpuTypes[0];

    if (!info.lowestPrice?.minimumBidPrice) {
      await interaction.editReply("No more " + gpu.id + " available");
      return;
    }

    const launch = await gql({
      operationName: "BidPod",
      variables: {
        input: {
          gpuCount: 1,
          cloudType: "COMMUNITY",
          volumeInGb: 0,
          containerDiskInGb: 40,
          minVcpuCount: 8,
          minMemoryInGb: info.memoryInGb,
          gpuTypeId: info.id,
          bidPerGpu: info.lowestPrice.minimumBidPrice,
          templateId: "76yr2zfiio",
          startJupyter: true,
          startSsh: true,
          volumeKey: null,
        },
      },
      query:
        "mutation BidPod($input: PodRentInterruptableInput!) {\n  podRentInterruptable(input: $input) {\n    id\n    machineId\n    __typename\n  }\n}",
    });

    console.log(JSON.stringify(launch));
    await interaction.editReply(`${gpu.id} launched!`);
  }

  if (commandName === "gpu") {
    await interaction.deferReply();
    // {
    //     "data": {
    //         "gpuTypes": [
    //             {
    //                 "maxGpuCount": 8,
    //                 "id": "NVIDIA A100 80GB PCIe",
    //                 "displayName": "A100 80GB",
    //                 "memoryInGb": 80,
    //                 "secureCloud": true,
    //                 "communityCloud": true,
    //                 "__typename": "GpuType"
    //             },
    //         ]
    //     }
    // }
    const response = await gql({
      operationName: "GpuTypes",
      variables: {},
      query:
        "query GpuTypes {\n  gpuTypes {\n    maxGpuCount\n    id\n    displayName\n    memoryInGb\n    secureCloud\n    communityCloud\n    __typename\n  }\n}",
    });

    const gpuData = response.data.gpuTypes.filter((gpu: any) => gpu.memoryInGb >= 16);
    let embeds = await Promise.all(
      gpuData.map(async (gpuType: any) => {
        let info;
        try {
          info = await gql({
            operationName: "GpuTypes",
            variables: {
              gpuTypesInput: { id: gpuType.id },
              lowestPriceInput: {
                gpuCount: 1,
                minMemoryInGb: gpuType.memoryInGb,
                minVcpuCount: 2,
                secureCloud: false,
              },
            },
            query:
              "query GpuTypes($lowestPriceInput: GpuLowestPriceInput, $gpuTypesInput: GpuTypeFilter) {\n  gpuTypes(input: $gpuTypesInput) {\n    lowestPrice(input: $lowestPriceInput) {\n      minimumBidPrice\n      uninterruptablePrice\n      minVcpu\n      minMemory\n      __typename\n    }\n    maxGpuCount\n    id\n    displayName\n    memoryInGb\n    __typename\n  }\n}",
          });
        } catch (e) {
          console.log(e);
          return false;
        }

        const gpu = info.data.gpuTypes[0];
        if (!gpu.lowestPrice?.minimumBidPrice && !gpu.lowestPrice?.uninterruptablePrice) {
          return false;
        }

        console.log(JSON.stringify(info));

        return {
          color: 0x0099ff,
          title: `${gpu.id}`,
          author: {
            name: "Runpod",
            icon_url: "https://pbs.twimg.com/profile_images/1506210273266483203/5l90_l0q_400x400.png",
            url: "https://runpod.io",
          },
          description: `${gpu.memoryInGb} GB`,
          thumbnail: {
            url: "https://pbs.twimg.com/profile_images/1506210273266483203/5l90_l0q_400x400.png",
          },
          fields: [
            {
              name: "Spot Price",
              value: `${gpu.lowestPrice?.minimumBidPrice ? `$${gpu.lowestPrice?.minimumBidPrice}` : "Unavailable"}`,
            },
            {
              name: `On Demand Price`,
              value: `${
                gpu.lowestPrice?.uninterruptablePrice ? `$${gpu.lowestPrice?.uninterruptablePrice}` : "Unavailable"
              }`,
            },
          ],
        };
      }),
    );
    embeds = embeds.filter((e: any) => !!e);

    console.log(JSON.stringify(embeds));
    // {
    //     "data": {
    //         "gpuTypes": [
    //             {
    //                 "lowestPrice": {
    //                     "minimumBidPrice": 0.125,
    //                     "uninterruptablePrice": 0.21,
    //                     "minVcpu": 10,
    //                     "minMemory": 15,
    //                     "__typename": "LowestPrice"
    //                 },
    //                 "maxGpuCount": 4,
    //                 "id": "NVIDIA GeForce RTX 3080",
    //                 "displayName": "RTX 3080",
    //                 "memoryInGb": 10,
    //                 "__typename": "GpuType"
    //             }
    //         ]
    //     }
    // }
    await interaction.editReply({ embeds });
  }

  if (commandName === "stop") {
    await interaction.deferReply();
    let pod_id = interaction.options.getString("pod_id");
    console.log(pod_id);
    if (!pod_id) {
      // never happening
      return;
    }
    const response = await stopPod(pod_id);
    await interaction.editReply(`Stopping pod: ${response.id}`);
  }

  if (commandName === "queue") {
    await interaction.deferReply();
    const pods = await getPods();
    const itemsInQueue = (await pool.query("select count(*) as c from jobs where running = false and done = false"))
      .rows[0].c;
    const ageOfOldest =
      (await pool.query("select (now() - min(created_at)) as c from jobs where running = false and done = false"))
        .rows[0]?.c || 0;
    const lastHour = (
      await pool.query(
        "select count(*) as c, avg(started_at - created_at) as d from jobs where created_at > now() - interval '1 hour' and done = true",
      )
    ).rows[0];
    const last10Mins = (
      await pool.query(
        "select count(*) as c, avg(started_at - created_at) as d from jobs where created_at > now() - interval '10 minutes' and done = true",
      )
    ).rows[0];
    const last1mins = (
      await pool.query(
        "select count(*) as c, avg(started_at - created_at) as d from jobs where created_at > now() - interval '1 minutes' and done = true",
      )
    ).rows[0];

    const numberOfPods = pods.data.myself.pods.length;
    const toClear = (itemsInQueue / numberOfPods) * 10;

    const embed = {
      color: 0x0099ff,
      title: `${itemsInQueue} items`,
      description: `ETA to clear queue: ${toClear} seconds`,
      author: {
        name: "Diffusion.gg",
        //icon_url: 'https://pbs.twimg.com/profile_images/1506210273266483203/5l90_l0q_400x400.png',
        url: "https://runpod.io",
      },
      fields: [
        {
          name: "Age of oldest item",
          value: `${postgresDateThingToSeconds(ageOfOldest)} seconds`,
        },
        {
          name: "Last Hour",
          value: `${lastHour.c} processed, avg time ${postgresDateThingToSeconds(lastHour.d)} seconds`,
        },
        {
          name: "Last 10 Min",
          value: `${last10Mins.c} processed, avg time ${postgresDateThingToSeconds(last10Mins.d)} seconds`,
        },
        {
          name: "Last 1 Min",
          value: `${last1mins.c} processed, avg time ${postgresDateThingToSeconds(last1mins.d)} seconds`,
        },
      ],
    };

    await interaction.editReply({ embeds: [embed] });
  }

  if (commandName === "pods") {
    await interaction.deferReply();
    const pods = await getPods();

    if (pods.data.myself.pods.length === 0) {
      await interaction.editReply("No running pods");
      return;
    }

    const embeds: any[] = [];
    for (const pod of pods.data.myself.pods) {
      console.log(JSON.stringify(pod));
      const embed = {
        color: 0x0099ff,
        title: `${pod.machine.gpuDisplayName} ${pod.name} `,
        author: {
          name: "Runpod",
          icon_url: "https://pbs.twimg.com/profile_images/1506210273266483203/5l90_l0q_400x400.png",
          url: "https://runpod.io",
        },
        description: `${pod.desiredStatus} `,
        thumbnail: {
          url: "https://pbs.twimg.com/profile_images/1506210273266483203/5l90_l0q_400x400.png",
        },
        fields: [
          {
            name: "id",
            value: pod.id,
          },
          {
            name: `Instance Type`,
            value: `${pod.podType} `,
          },
          {
            name: `Uptime`,
            value: `${Math.round(pod.runtime?.uptimeInSeconds / 3600)} hours`,
          },
          {
            name: `Cost per hour`,
            value: `$${pod.costPerHr} `,
          },
          {
            name: "Total cost",
            value: `$${round2dp(pod.costPerHr * (pod.runtime?.uptimeInSeconds / 3600 || 0))} `,
          },
          {
            name: "Avg GPU",
            value: `${pod.runtime?.gpus.map((g) => `${g.gpuUtilPercent}%`).join(" ")} `,
          },
          {
            name: "Avg GPU memory",
            value: `${pod.runtime?.gpus.map((g) => `${g.memoryUtilPercent}%`).join(" ")} `,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      embeds.push(embed);
    }

    await interaction.editReply({ embeds });
  }
}

client.on("interactionCreate", async (interaction) => {
  try {
    await handleInteraction(interaction);
  } catch (e) {
    console.log(e);
  }
});

export async function start() {
  await client.login(process.env.GALACTUS_DISCORD_TOKEN);
}

start();
