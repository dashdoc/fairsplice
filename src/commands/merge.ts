import { Glob } from "bun";
import { saveTimings } from "../backend/fileStorage";

export async function merge({
  timingsFile,
  prefix,
}: {
  timingsFile: string;
  prefix: string;
}) {
  // find all timing JSON files matching the prefix pattern
  const glob = new Glob(`${prefix}*`);
  const files = Array.from(glob.scanSync());

  if (files.length === 0) {
    console.warn(`No files found matching prefix: ${prefix}*`);
    console.warn(`Skipping merge (this is normal if all tests failed or were skipped)`);
    return;
  }

  console.log(`Found ${files.length} timing files to merge:`);
  files.forEach((f) => console.log(`  - ${f}`));

  // aggregate timings from all JSON files
  const timingByFile: Record<string, number> = {};

  for (const file of files) {
    const content = await Bun.file(file).text();
    const timings = JSON.parse(content) as Record<string, number>;

    for (const [testFile, timing] of Object.entries(timings)) {
      if (!timingByFile[testFile]) {
        timingByFile[testFile] = 0;
      }
      timingByFile[testFile] += timing;
    }
  }

  // save merged timings
  await saveTimings(timingsFile, timingByFile);
  console.log(`\nMerged timings for ${Object.keys(timingByFile).length} files`);
}
