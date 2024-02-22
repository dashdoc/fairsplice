import { saveTimings } from "../backend/redis";
import { parseJunit } from "../lib/junit";

export async function save({ from }: { from: string | undefined }) {
  if (!from) {
    console.warn(
      "Please provide the --from option to specify the file to read test results from"
    );
    process.exit(1);
  }

  // read junit xml file
  const junitXmlFile = Bun.file(from);
  const xmlString = await junitXmlFile.text();

  // parse junit xml
  const testCases = parseJunit(xmlString);

  // aggregate timings
  const timingByFile: Record<string, number> = {};
  for (let testCase of testCases) {
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

  // save timings
  await saveTimings(timingByFile);
}
