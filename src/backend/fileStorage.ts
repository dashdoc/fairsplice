import { average } from "../lib/average";
import { NUMBER_OF_TIMINGS_TO_KEEP, TIMINGS_FILE_PATH } from "../config";

interface TimingsData {
  version: number;
  timings: Record<string, number[]>;
}

async function readTimingsFile(): Promise<TimingsData> {
  const file = Bun.file(TIMINGS_FILE_PATH);
  if (!(await file.exists())) {
    return { version: 1, timings: {} };
  }
  try {
    const content = await file.text();
    return JSON.parse(content) as TimingsData;
  } catch {
    // If file is corrupted or invalid, start fresh
    return { version: 1, timings: {} };
  }
}

async function writeTimingsFile(data: TimingsData): Promise<void> {
  await Bun.write(TIMINGS_FILE_PATH, JSON.stringify(data, null, 2));
}

export async function saveTimings(
  timingByFile: Record<string, number>
): Promise<void> {
  const data = await readTimingsFile();

  for (const [file, timing] of Object.entries(timingByFile)) {
    // Initialize array if doesn't exist
    if (!data.timings[file]) {
      data.timings[file] = [];
    }

    // Add new timing at the beginning (like Redis LPUSH)
    data.timings[file].unshift(timing);

    // Keep only the last NUMBER_OF_TIMINGS_TO_KEEP timings (like Redis LTRIM)
    if (data.timings[file].length > NUMBER_OF_TIMINGS_TO_KEEP) {
      data.timings[file] = data.timings[file].slice(
        0,
        NUMBER_OF_TIMINGS_TO_KEEP
      );
    }
  }

  await writeTimingsFile(data);
}

export async function getTimings(
  files: string[]
): Promise<Record<string, number>> {
  const data = await readTimingsFile();

  const timingByFile: Record<string, number> = {};
  for (const file of files) {
    const timings = data.timings[file];
    if (timings && timings.length > 0) {
      timingByFile[file] = average(timings);
    }
  }

  return timingByFile;
}
