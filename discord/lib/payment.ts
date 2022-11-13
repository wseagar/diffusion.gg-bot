import { discord_servers, discord_users } from "@prisma/client";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import Stripe from "stripe";
import { DBDiscordServer, DBDiscordUser } from "../../rest/db";
import { DiffusionInteraction, isDiffusionDiscord } from "./diffusion";

const stripe = new Stripe(process.env.STRIPE_SK as string, {
  apiVersion: "2022-08-01",
});

const stripeBuyLinks = {
  prod: {
    "360": "price_1Lmt9GEmz893guYSIWOPqo5Z",
    "1140": "price_1Lmt7YEmz893guYSdVqNJ4ee",
    "3980": "price_1Lmt6pEmz893guYSffQjmLqK",
  },
  dev: {
    "360": "price_1LmsjmEmz893guYSsycIcnuA",
    "1140": "price_1LmssgEmz893guYSbUildQHM",
    "3980": "price_1Lmt4nEmz893guYS2iEEpJWW",
  },
};

const stripeSubLinks = {
  prod: "price_1LrGpzEmz893guYS70VVpnHL",
  dev: "price_1LrGpXEmz893guYSpyIAFU8T",
};

export function makeSubLink(userId: string) {
  let stage = process.env.STAGE;
  if (stage !== "prod") {
    stage = "dev";
  }
  const price = stripeSubLinks[stage as "dev" | "prod"];

  const paymentLinkPromise = stripe.paymentLinks.create({
    line_items: [
      {
        price: price,
        quantity: 1,
      },
    ],
    metadata: {
      type: "subscription",
      user_id: userId,
    },
  });
  return paymentLinkPromise;
}

function makePaymentLink(creditType: "user" | "server", userId: string, serverId?: string) {
  let stage = process.env.STAGE;
  if (stage !== "prod") {
    stage = "dev";
  }
  const buyLinks = stripeBuyLinks[stage as "dev" | "prod"];

  function getUserMeta(credits: number) {
    return {
      type: "user",
      user_id: userId,
      credits: credits,
    };
  }

  function getServerMeta(credits: number) {
    return {
      type: "server",
      user_id: userId,
      server_id: serverId,
      credits: credits,
    };
  }
  const promises: Promise<Stripe.Response<Stripe.PaymentLink>>[] = [];
  for (const [key, value] of Object.entries(buyLinks)) {
    const credits = Number(key);
    const price = value;

    const paymentLinkPromise = stripe.paymentLinks.create({
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      metadata: creditType === "user" ? getUserMeta(credits) : getServerMeta(credits),
    });
    promises.push(paymentLinkPromise);
  }
  return promises;
}

export async function makeBuyCreditsButtons(
  interaction: DiffusionInteraction,
  dbUser: discord_users,
  dbServer: discord_servers | null,
) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  const sublinkPromise = makeSubLink(dbUser.id);
  const userPaymentLinksPromise = makePaymentLink("user", dbUser.id);
  if (dbServer && !isDiffusionDiscord(interaction)) {
    const serverPaymentLinksPromise = makePaymentLink("server", dbUser.id, dbServer.id);
    const serverPaymentLinks = await Promise.all(serverPaymentLinksPromise);

    const plan1 = new ButtonBuilder()
      .setLabel(`Add 360 server credits`)
      .setURL(serverPaymentLinks[0].url)
      .setStyle(ButtonStyle.Link);
    const plan2 = new ButtonBuilder()
      .setLabel(`Add 1140 server credits`)
      .setURL(serverPaymentLinks[1].url)
      .setStyle(ButtonStyle.Link);
    const plan3 = new ButtonBuilder()
      .setLabel(`Add 3980 server credits`)
      .setURL(serverPaymentLinks[2].url)
      .setStyle(ButtonStyle.Link);

    const serverRow = new ActionRowBuilder<ButtonBuilder>().addComponents([plan1, plan2, plan3]);
    // rows.push(serverRow);
  }

  const userPaymentLinks = await Promise.all(userPaymentLinksPromise);

  const plan1 = new ButtonBuilder()
    .setLabel(`Add 360 user credits`)
    .setURL(userPaymentLinks[0].url)
    .setStyle(ButtonStyle.Link);
  const plan2 = new ButtonBuilder()
    .setLabel(`Add 1140 user credits`)
    .setURL(userPaymentLinks[1].url)
    .setStyle(ButtonStyle.Link);
  const plan3 = new ButtonBuilder()
    .setLabel(`Add 3980 user credits`)
    .setURL(userPaymentLinks[2].url)
    .setStyle(ButtonStyle.Link);

  // const userRow = new ActionRowBuilder<ButtonBuilder>().addComponents([plan1, plan2, plan3]);

  // rows.unshift(userRow);

  const subLink = await sublinkPromise;

  const subrow = new ActionRowBuilder<ButtonBuilder>().addComponents([]);
  if (dbUser.stripe_customer_id) {
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripe_customer_id,
      return_url: "https://diffusion.gg",
    });
    subrow.addComponents(
      new ButtonBuilder().setLabel("Manage Subscription").setURL(session.url).setStyle(ButtonStyle.Link),
    );
  } else {
    const subscribe = new ButtonBuilder()
      .setLabel(`SUBSCRIBE (1.5x CREDITS)`)
      .setURL(subLink.url)
      .setStyle(ButtonStyle.Link);
    // subrow.addComponents(subscribe);
  }
  rows.unshift(subrow);

  return rows;
}
