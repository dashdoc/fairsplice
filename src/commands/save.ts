import { saveTimings } from "../backend/backend";
import { hash } from "../lib/hash";
import { parseJunit } from "../lib/junit";

export async function save(
  options: Record<string, string[] | string | boolean | undefined>
) {
  if (!options.from) {
    console.warn(
      "Please provide the --from option to specify the file to read test results from"
    );
    process.exit(1);
  }

  // read junit xml file
  const junitXmlFile = Bun.file(options.from);
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

  // hash filenames
  const timingByHash: Record<string, number> = {};
  for (const [file, timing] of Object.entries(timingByFile)) {
    timingByHash[hash(file)] = Math.round(timing * 1000);
  }

  // save timings
  await saveTimings(timingByHash);
}
