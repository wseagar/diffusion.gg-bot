import * as fs from "fs";

const data = JSON.parse(fs.readFileSync("./styles.json").toString("utf-8"));

const internalChoice = data;

export const externalChoice: { name: string; value: string }[] = data.map((d: any) => ({
  name: d.name,
  value: d.name,
}));

export function getPromptSuffix(style: string): string {
  return internalChoice.find((internal: any) => internal.name === style)?.value || "";
}
