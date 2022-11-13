import "dotenv/config";
import { pool } from "../rest/db";
import * as fs from "fs";
import * as readline from "readline";

const schema = fs.readFileSync("./sql-schema.sql").toString();
const drop = fs.readFileSync("./sql-drop.sql").toString();

function askQuestion(query: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

async function main() {
  console.log(`[${process.env.stage}] Starting Migration`);
  if (process.env.stage !== "dev") {
    const resp = await askQuestion(
      `[${process.env.stage}] Are you sure you wish to migrate [${process.env.stage}]? (Y/N) \n`,
    );
    if (resp !== "y") {
      console.log("exiting");
      process.exit(0);
    }
  }
  const db = await pool.connect();
  if (process.env.stage === "dev") {
    await db.query(drop);
  }
  await db.query(schema);

  console.log(`[${process.env.stage}] Migration Complete`);
  process.exit(0);
}

main();
