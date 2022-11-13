import fetch from "node-fetch";
import { prevalidatePrompt } from "./db";

const yearOld: string[] = []
for (let i = 1; i < 18; i++) {
  yearOld.push(`${i} year old`);
  yearOld.push(`${i} years old`);
}

const need = ["little", "young", "children", "loli", "child", "kid", "baby", "preteen", ...yearOld];

const risk = [
  "raped",
  "topless",
  "naked",
  "nudism",
  "nude",
  "vagina",
  "penis",
  "anal",
  "sex",
  "breast",
  "boob",
  "vaginal",
  "orgasm",
  "bath",
  "bathtime",
  "pussy",
  "fuck",
  "fucking",
];

export async function sendInternalWebhook(username: string, content: string) {
  try {
    const url  = process.env.INTERNAL_WEBHOOK_URL as string
    await fetch(
      url,
      {
        method: "POST",
        headers: {
          'Content-Type': "application/json"
        },
        body: JSON.stringify({
          username: username,
          content: content,
        }),
      },
    );
  } catch (e) {
    console.log(e);
    console.log("WEBHOOK FAILED")
  }
}

export async function preValidate(prompt: string) {
  const result = await prevalidatePrompt(prompt);
  if (!result.success) {
    return { success: false, reason: { match: "DB", data: result.results }}
  }

  const lower = prompt.toLocaleLowerCase();

  const needMatches: string[] = [];
  for (const n of need) {
    if (lower.includes(n)) {
      needMatches.push(n);
    }
  }

  const riskMatches: string[] = [];
  for (const r of risk) {
    if (lower.includes(` ${r}`)) {
      riskMatches.push(r);
    }
  }
  if (needMatches.length > 0 && riskMatches.length > 0) {
    return { success: false, reason: { match: "KEYWORD", data: { age_keywords: needMatches, risk_keywords: riskMatches}}}
  }

  return { success: true };
}