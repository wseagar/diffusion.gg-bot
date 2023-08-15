import * as Sentry from "@sentry/node";
import "@sentry/tracing";

// if (process.env.STATE === "prod" && process.env.SENTRY_DSN) {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN as string,
//     tracesSampleRate: 1.0,
//   });
// }

import * as api from "./rest/api";
import * as discord from "./discord/bot";

discord.start();
api.start();
