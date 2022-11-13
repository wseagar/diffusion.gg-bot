import "dotenv/config";
import {
  setSubscribed,
  useDiscordCredit,
  createJob,
  getJob,
  DBJob,
  getQueueLength,
  getImages,
  setFirstMessageSent,
  setUnsubscribed,
  addCredits,
  addServerCredits,
} from "./db";
import { FromSchema } from "json-schema-to-ts";
import Stripe from "stripe";
import Fastify from "fastify";
import { preValidate, sendInternalWebhook } from "./nsfl";

const fastify = Fastify({ logger: true });

const stripe = new Stripe(process.env.STRIPE_SK as string, {
  apiVersion: "2022-08-01",
});

const sharedHeaderJsonSchema = {
  type: "object",
  required: ["diffusion-secret"],
  properties: {
    "diffusion-secret": { type: "string" },
  },
} as const;

const jobsBodyJsonSchema = {
  type: "object",
  required: ["prompt"],
  properties: {
    prompt: { type: "string" },
    ddim_steps: {
      type: "integer",
      default: 32,
      minimum: 1,
      maximum: 200,
    },
    n_samples: {
      type: "integer",
      default: 2,
      minimum: 1,
      maximum: 6,
    },
    seed: {
      type: "integer",
      default: 42,
      minimum: 1,
    },
    prio: {
      type: "integer",
      default: 0,
    },
    sampler: {
      type: "string",
      default: "k_euler"
    }
  },
} as const;

const prevalidateBodyJsonSchema = {
  type: "object",
  required: ["prompt"],
  properties: {
    prompt: { type: "string" },
  },
} as const;

const jobsResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    id: { type: "string" },
  },
} as const;

const jobsGetJsonSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
} as const;

type APIJob = DBJob & { images: any[] };

export async function start() {
  await fastify.register(import("fastify-raw-body"), {
    field: "rawBody", // change the default request.rawBody property name
    global: false, // add the rawBody to every request. **Default true**
    encoding: "utf8", // set it to false to set rawBody as a Buffer **Default utf8**
    runFirst: true, // get the body before any preParsing hook change/uncompress it. **Default false**
    routes: ["/stripe/webhook"], // array of routes, **`global`** will be ignored, wildcard routes not supported
  });

  // health check for fly.io
  fastify.get("/", async (request, reply) => {
    return { success: true };
  });

  fastify.post<{ Body: FromSchema<typeof prevalidateBodyJsonSchema> }>("/prevalidate", {
    schema: {
      body: prevalidateBodyJsonSchema,
      headers: sharedHeaderJsonSchema
    }
  },
  async (request, reply) => {
    console.log("PREVALIDATE: ", request.body);
    if (request.headers["diffusion-secret"] !== process.env.DIFFUSION_SECRET) {
      reply.status(403).send({ msg: "invalid secret" });
      return;
    }

    const { prompt, } = request.body;

    const response = await preValidate(prompt);

    reply.status(200).send(response);
  })

  fastify.post<{ Body: FromSchema<typeof jobsBodyJsonSchema> }>(
    "/jobs",
    {
      schema: {
        body: jobsBodyJsonSchema,
        response: {
          200: jobsResponseJsonSchema,
        },
        headers: sharedHeaderJsonSchema,
      },
    },
    async (request, reply) => {
      console.log(request.body);
      if (request.headers["diffusion-secret"] !== process.env.DIFFUSION_SECRET) {
        reply.status(403).send({ msg: "invalid secret" });
        return;
      }

      const { prompt, ddim_steps, n_samples, seed, sampler, prio, ...rest } = request.body;

      const jobId = await createJob(
        {
          prompt,
          ddim_steps,
          n_samples,
          seed,
          sampler,
          type: "txt2img",
          ...rest,
        },
        prio || 0,
      );
      reply.status(200).send({ id: jobId });
    },
  );

  fastify.get<{ Params: FromSchema<typeof jobsGetJsonSchema> }>(
    "/jobs/:id",
    {
      schema: { params: jobsGetJsonSchema },
    },
    async (request, reply) => {
      if (request.headers["diffusion-secret"] !== process.env.DIFFUSION_SECRET) {
        reply.status(403).send({ msg: "invalid secret" });
        return;
      }

      const { id } = request.params;
      const job = (await getJob(id));
      if (!job) {
        reply.status(404).send();
        return;
      }
      const queue = await getQueueLength(job.created_at, job.prio);
      let images: any = [];
      if (job.done) {
        images = await getImages(job.id);
      }
      reply.status(200).send({ job, images, queue });
    },
  );

  fastify.post("/stripe/webhook", { config: { rawBody: true } }, async (request, reply) => {
    const signature = request.headers["stripe-signature"];
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody as string,
        signature as string,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err: any) {
      reply.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case "checkout.session.completed":
        const data = event.data.object as Stripe.Checkout.Session;
        if (!data?.metadata?.type) {
          reply.status(400).send(`Webhook Error: No TYPE`);
          return;
        }

        await sendInternalWebhook("Stripe Checkout Session!", JSON.stringify(data.metadata, null, 2))
       
        if (data.metadata.type === "user") {
          if (!data?.metadata?.credits) {
            reply.status(400).send(`Webhook Error: No CREDITS`);
            return;
          }
          const credits = Number(data?.metadata?.credits);

          console.log("Adding user credits")
          const userId = data.metadata.user_id;
          await addCredits(userId, credits);
        } else if (data.metadata.type === "server") {
          if (!data?.metadata?.credits) {
            reply.status(400).send(`Webhook Error: No CREDITS`);
            return;
          }
          const credits = Number(data?.metadata?.credits);

          console.log("Adding server credits")
          const serverId = data.metadata.server_id;
          await addServerCredits(serverId, credits);
        } else if (data.metadata.type === "subscription") {
          await setSubscribed(data?.metadata?.user_id, data.customer as string);
        }
        break;
      case "customer.subscription.deleted":
        await sendInternalWebhook("Stripe Unsub :(", "Big rip... 2 lazy view stripe for dets")

        const customer = (event.data.object as any).customer as string;
        await setUnsubscribed(customer);
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    reply.status(200).send();
  });

  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    fastify.log.info(`server listening on 8080`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
