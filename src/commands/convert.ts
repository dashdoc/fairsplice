import { parseJunit } from "../lib/junit";

export async function convert({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  // check if input file exists
  const junitXmlFile = Bun.file(from);
  if (!(await junitXmlFile.exists())) {
    console.warn(`Input file not found: ${from}`);
    console.warn(`Skipping convert (this is normal if tests were skipped or failed early)`);
    return;
  }

  // read junit xml file
  const xmlString = await junitXmlFile.text();

  // parse junit xml
  const testCases = parseJunit(xmlString);

  // aggregate timings by file
  const timingByFile: Record<string, number> = {};
  for (const testCase of testCases) {
    if (testCase.file.includes("..")) {
      continue;
    }
    if (!timingByFile[testCase.file]) {
      timingByFile[testCase.file] = 0;
    }
    timingByFile[testCase.file] += testCase.time;
  }

  // convert to ms
  for (const [file, timing] of Object.entries(timingByFile)) {
    timingByFile[file] = Math.round(timing * 1000);
  }

  // write timings JSON
  await Bun.write(to, JSON.stringify(timingByFile, null, 2));
  console.log(`Converted ${Object.keys(timingByFile).length} test timings to ${to}`);
}
