import { parseJunit } from "../lib/junit";

export async function convert({
  from,
  out,
}: {
  from: string;
  out: string;
}) {
  // read junit xml file
  const junitXmlFile = Bun.file(from);
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
  await Bun.write(out, JSON.stringify(timingByFile, null, 2));
  console.log(`Converted ${Object.keys(timingByFile).length} test timings to ${out}`);
}
