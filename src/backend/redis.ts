import { createClient } from "redis";
import { average } from "../lib/average";
import {
  NUMBER_OF_TIMINGS_TO_KEEP,
  REDIS_KEY_PREFIX,
  REDIS_URL,
} from "../config";

async function getClient() {
  const client = createClient({ url: REDIS_URL, socket: { tls: true } });
  await client.connect();
  return client;
}

function getKey(file: string) {
  return `${REDIS_KEY_PREFIX}:${file}`;
}

export async function saveTimings(timingByFile: Record<string, number>) {
  const client = await getClient();
  const transaction = client.multi();
  for (const [file, timing] of Object.entries(timingByFile)) {
    const key = getKey(file);
    // first we push the new timing
    transaction.lPush(key, timing.toString());
    // then we trim the list to keep only the last TIMINGS_TO_KEEP timings
    transaction.lTrim(key, 0, NUMBER_OF_TIMINGS_TO_KEEP - 2);
    // then we set the expiration time for the key (30 days in seconds)
    transaction.expire(key, 2592000);
  }
  await transaction.exec();
}

export async function getTimings(files: string[]) {
  const client = await getClient();
  // fetch the last NUMBER_OF_TIMINGS_TO_KEEP timings for each file
  const transaction = client.multi();
  for (const file of files) {
    const key = getKey(file);
    transaction.lRange(key, 0, NUMBER_OF_TIMINGS_TO_KEEP - 1);
  }
  const results = await transaction.exec();

  // convert results to a map of file -> average timing
  const timingByFile: Record<string, number> = {};
  for (const [i, file] of files.entries()) {
    const result = results[i];
    if (
      typeof result === "number" ||
      typeof result === "string" ||
      result?.length === 0 ||
      !result
    ) {
      continue;
    }
    const timings = Array.from(result).map(Number);
    const timing = average(timings);
    timingByFile[file] = timing;
  }
  return timingByFile;
}
