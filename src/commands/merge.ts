import { Glob } from "bun";
import { saveTimings } from "../backend/fileStorage";
import { parseJunit } from "../lib/junit";

export async function merge({
  timingsFile,
  prefix,
}: {
  timingsFile: string;
  prefix: string;
}) {
  // find all files matching the prefix pattern
  const glob = new Glob(`${prefix}*`);
  const files = Array.from(glob.scanSync());

  if (files.length === 0) {
    console.warn(`No files found matching prefix: ${prefix}*`);
    process.exit(1);
  }

  console.log(`Found ${files.length} files to merge:`);
  files.forEach((f) => console.log(`  - ${f}`));

  // aggregate timings from all files
  const timingByFile: Record<string, number> = {};

  for (const file of files) {
    const junitXmlFile = Bun.file(file);
    const xmlString = await junitXmlFile.text();

    // parse junit xml
    const testCases = parseJunit(xmlString);

    // aggregate timings
    for (let testCase of testCases) {
      if (testCase.file.includes("..")) {
        continue;
      }
      if (!timingByFile[testCase.file]) {
        timingByFile[testCase.file] = 0;
      }
      timingByFile[testCase.file] += testCase.time;
    }
  }

  // convert to ms
  for (const [file, timing] of Object.entries(timingByFile)) {
    timingByFile[file] = Math.round(timing * 1000);
  }

  // save timings
  await saveTimings(timingsFile, timingByFile);
  console.log(
    `\nTimings saved for ${Object.keys(timingByFile).length} files`
  );
}
