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

function getKey(hash: string) {
  return `${REDIS_KEY_PREFIX}:${hash}`;
}

export async function saveTimings(timingByHash: Record<string, number>) {
  const client = await getClient();
  const transaction = client.multi();
  for (const [hash, timing] of Object.entries(timingByHash)) {
    const key = getKey(hash);
    // first we push the new timing
    transaction.lPush(key, timing.toString());
    // then we trim the list to keep only the last TIMINGS_TO_KEEP timings
    transaction.lTrim(key, 0, NUMBER_OF_TIMINGS_TO_KEEP - 2);
    // then we set the expiration time for the key (30 days in seconds)
    transaction.expire(key, 2592000);
  }
  await transaction.exec();
  console.log(`Saved timings for ${Object.keys(timingByHash).length} files`);
}

export async function getTimings(hashes: string[]) {
  const client = await getClient();
  // fetch the last NUMBER_OF_TIMINGS_TO_KEEP timings for each hash
  const transaction = client.multi();
  for (const hash of hashes) {
    const key = getKey(hash);
    transaction.lRange(key, 0, NUMBER_OF_TIMINGS_TO_KEEP - 1);
  }
  const results = await transaction.exec();

  // convert results to a map of hash -> average timing
  const timingByHash: Record<string, number> = {};
  for (const [i, hash] of hashes.entries()) {
    console.log(results[i]);
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
    timingByHash[hash] = timing;
  }
  return timingByHash;
}
