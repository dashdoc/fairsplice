const API_URL = process.env.FAIRSPLICE_BACKEND_URL;
const API_KEY = process.env.FAIRSPLICE_BACKEND_KEY;

const PREFIX = "fairsplice:timings:";
const TIMINGS_TO_KEEP = 10;

async function exec(commands: string[][]) {
  const response = await fetch(`${API_URL}/multi-exec`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(commands),
    method: "POST",
  });
  const data = response.json();
  return data;
}

export async function saveTimings(timingByHash: Record<string, number>) {
  const results = await exec(
    Object.entries(timingByHash).flatMap(([hash, timing]) => [
      // first we push the new timing
      ["LPUSH", `${PREFIX}:${hash}`, timing.toString()],
      // then we trim the list to keep only the last TIMINGS_TO_KEEP timings
      ["LTRIM", `${PREFIX}:${hash}`, "0", `${TIMINGS_TO_KEEP - 2}`],
      // then we set the expiration time for the key (30 days in seconds)
      ["EXPIRE", `${PREFIX}:${hash}`, "2592000"],
    ])
  );
  console.log(`Saved timings for ${Object.keys(timingByHash).length} files`);
}

export async function getTimings(hashes: string[]) {
  // fetch the last TIMINGS_TO_KEEP timings for each hash
  const results = await exec(
    hashes.map((hash) => [
      "LRANGE",
      `${PREFIX}:${hash}`,
      "0",
      `${TIMINGS_TO_KEEP - 1}`,
    ])
  );

  // convert results to a map of hash -> average timing
  const timingByHash: Record<string, number> = {};
  for (const [i, hash] of hashes.entries()) {
    const timings = results[i].result.map(Number);
    const timing = average(timings);
    timingByHash[hash] = timing;
  }
  return timingByHash;
}

function average(numbers: number[]) {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
