import { AnonymousGuild, Guild, User } from "discord.js";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime";

const prisma = new PrismaClient();

console.log(process.env.DB_SSL);

export const pool = new pg.Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: process.env.DB_SSL === "TRUE" ? true : false,
});

type JobTypes = "txt2img" | "img2img";

export type DBDiscordUser = {
  id: string;
  created_at: any;
  discord_id: string;
  discord_name: string;
  is_subscriber: boolean;
  user_credits: number;
  active: boolean;
  first_message_sent: boolean;
  stripe_customer_id: string;
  computed_free_trial: boolean;
  free_credits_timestamp: Date;
};

export type DBDiscordServer = {
  id: string;
  created_at: any;
  discord_id: string;
  discord_name: string;
  nsfw_filter: boolean;
  blocked: boolean;
  blocked_reason: string;
  server_credits: number;
};

export type DBJob = {
  id: string;
  created_at: any;
  started_at: any;
  running: boolean;
  args: any;
  logs: string;
  done: boolean;
  prio: number;
  discord_message_id?: string;
  results?: any;
};

async function getImages(job_id: string) {
  console.log("GET IMAGES START: ", job_id);
  const result = await prisma.images.findMany({ where: { job_id } });
  console.log("GET IMAGES END: ", job_id);
  return result;
}

async function getJob(id: string) {
  const job = await prisma.jobs.findUnique({ where: { id } });
  if (job === null) {
    return false;
  }
  const typedJob = job as JobTypeConvert<typeof job>;
  return typedJob;
}

type JobTypeConvert<T> = Omit<Omit<T, "results">, "args"> & { args: any; results: any };

async function getJobByMessageId(discord_message_id: string) {
  const job = await prisma.jobs.findFirst({ where: { discord_message_id } });
  if (job === null) {
    return false;
  }
  const typedJob = job as JobTypeConvert<typeof job>;
  return typedJob;
}

async function getQueueLength(created_at: any, prio: Decimal | number) {
  const total = await prisma.jobs.count({ where: { running: false, done: false } });
  const position = await prisma.jobs.count({
    where: { running: false, done: false, created_at: { lt: created_at }, prio: { gte: prio } },
  });
  return {
    total,
    position,
  };
}

async function galactusQueueInfo() {}

async function createJob(args: any, prio = 0) {
  const job = await prisma.jobs.create({
    data: {
      args,
      prio,
    },
  });

  return job.id;
}

async function canCreateNewJob(discord_user_id: string) {
  const job = await prisma.jobs.findFirst({
    where: { args: { path: ["discord_user"], equals: discord_user_id }, done: false },
  });
  if (job === null) {
    return true;
  }

  return false;
}

async function getDiscordServer(discord_id: string, discord_name: string) {
  const server = await prisma.discord_servers.upsert({
    where: {
      discord_id,
    },
    update: {
      discord_name,
    },
    create: {
      discord_id,
      discord_name,
      blocked: false,
      blocked_reason: "",
      nsfw_filter: true,
      server_credits: 0,
    },
  });
  return server;
}

async function getDiscordUser(discord_id: string, discord_name: string) {
  await refreshDiscordCredits(discord_id);

  const user = await prisma.discord_users.upsert({
    where: {
      discord_id,
    },
    update: {
      discord_name,
    },
    create: {
      discord_id,
      discord_name,
      is_subscriber: false,
      images_generated: 0,
      active: true,
      stripe_customer_id: undefined,
      user_credits: 40,
    },
  });

  return user;
}

async function refreshDiscordCredits(discord_id: string) {
  await prisma.$queryRaw`
    UPDATE discord_users 
    SET user_credits = 10, free_credits_timestamp = now()
    WHERE discord_id = ${discord_id} AND user_credits < 10 AND free_credits_timestamp +  INTERVAL '1 DAY' < now();`;

  await prisma.$queryRaw`
    UPDATE discord_users 
    SET user_credits = user_credits + 1710, subscription_timestamp = now()
    WHERE discord_id = ${discord_id} AND subscription_timestamp is not null and subscription_timestamp + INTERVAL '1 MONTH' < now();`;
}

async function incrementImagesGenerated(id: string) {
  await prisma.discord_users.update({
    data: {
      images_generated: {
        increment: 1,
      },
    },
    where: { id },
  });
}

type DiscordCreditResult = {
  new_credits: number;
};

async function useDiscordCredit(id: string, server_id: string | null, credits: number) {
  if (server_id) {
    const result = await prisma.$queryRaw<DiscordCreditResult[]>`
          UPDATE discord_servers 
          SET server_credits = server_credits - ${credits}
          WHERE id = ${server_id}::uuid AND server_credits >= ${credits}
          RETURNING server_credits AS new_credits;`;

    if (result.length > 0) {
      console.log("USED SERVER CREDIT");
      return true;
    }
  }

  const result = await prisma.$queryRaw<DiscordCreditResult[]>`
        UPDATE discord_users 
        SET user_credits = user_credits - ${credits}
        WHERE id = ${id}::uuid AND user_credits  >= ${credits}
        RETURNING user_credits AS new_credits;`;

  if (result.length > 0) {
    console.log("USED USER CREDIT");
    return true;
  }

  console.log("NO CREDITS");
  return false;
}

async function addCredits(id: string, credits: number) {
  console.log(`Adding, ${credits} to ${id}`);
  await prisma.discord_users.update({
    data: {
      user_credits: {
        increment: credits,
      },
    },
    where: {
      id,
    },
  });
}

async function addServerCredits(id: string, credits: number) {
  console.log(`Adding, ${credits} to ${id}`);
  await prisma.discord_servers.update({
    data: {
      server_credits: {
        increment: credits,
      },
    },
    where: {
      id,
    },
  });
}

async function setFirstMessageSent(id: string) {
  await prisma.discord_users.update({ data: { first_message_sent: true }, where: { id } });
}

async function setSubscribed(id: string, stripe_customer_id: string) {
  await prisma.discord_users.update({
    data: {
      is_subscriber: true,
      stripe_customer_id: stripe_customer_id,
      subscription_timestamp: new Date(),
      user_credits: {
        increment: 1710,
      },
      nsfw_filter: false,
    },
    where: {
      id,
    },
  });
}

type PrevalidateResult = {
  success: boolean;
  results?: PrevalidateQueryResult[];
};

type PrevalidateQueryResult = {
  id: string;
  prompt: string;
};

async function prevalidatePrompt(prompt: string): Promise<PrevalidateResult> {
  const result = await prisma.$queryRaw<PrevalidateQueryResult[]>`
    select id, args->>'prompt' as prompt 
    from jobs 
    where is_deleted = true 
    and 
    lower({{ prompt }}) like '%' || lower(args->>'prompt') || '%'`;

  if (result.length === 0) {
    return { success: true };
  }

  return {
    success: false,
    results: result,
  };
}

async function setUnsubscribed(stripe_customer_id: string) {
  // await prisma.discord_users.update({
  //   data: {
  //     is_subscriber: false,
  //   },
  //   where: {
  //     str
  //   }
  // })

  await prisma.$queryRaw`
    UPDATE discord_users 
    SET is_subscriber = FALSE, nsfw_filter = TRUE, stripe_customer_id = null, subscription_timestamp = null
    WHERE stripe_customer_id = ${stripe_customer_id};`;
}

async function setNSFWFilter(discord_id: string, nsfw_filter: boolean) {
  await prisma.discord_users.update({ data: { nsfw_filter }, where: { discord_id } });
}

async function setJobMessageId(id: string, discord_message_id: string) {
  await prisma.jobs.update({ data: { discord_message_id }, where: { id } });
}

async function devCompleteJob(id: string) {
  await prisma.jobs.update({ data: { done: true }, where: { id } });
  await prisma.images.create({
    data: {
      job_id: id,
      nsfw: false,
      uri: "https://image.lexica.art/md/00d4990f-6a57-4aa6-bb6b-871753f8ed82",
    },
  });
  await prisma.images.create({
    data: {
      job_id: id,
      nsfw: false,
      uri: "https://image.lexica.art/md/6147a6bf-083b-45ba-a6eb-d62e0ba72f3b",
    },
  });
}

async function devCompleteDescribeJob(id: string) {
  await prisma.jobs.update({
    data: {
      done: true,
      results: { prompt: "Hello world" },
    },
    where: { id },
  });
}

async function cleanupOldJobs() {
  await prisma.$queryRaw`
    UPDATE jobs 
    SET done = false
    WHERE "created_at" < NOW() - INTERVAL '3 minutes' and done = false;`;
}

export {
  createJob,
  getQueueLength,
  getDiscordUser,
  useDiscordCredit,
  getJob,
  getJobByMessageId,
  setJobMessageId,
  getImages,
  setFirstMessageSent,
  setSubscribed,
  setUnsubscribed,
  addCredits,
  addServerCredits,
  getDiscordServer,
  setNSFWFilter,
  devCompleteJob,
  devCompleteDescribeJob,
  incrementImagesGenerated,
  canCreateNewJob,
  cleanupOldJobs,
  prevalidatePrompt,
};
