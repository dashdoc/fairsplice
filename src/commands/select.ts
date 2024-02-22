import { Glob } from "bun";
import { getTimings } from "../backend/redis";
import { splitFiles } from "../lib/splitFiles";
import { hash } from "../lib/hash";
import { DEFAULT_TIMING_IF_MISSING } from "../config";

export async function select(
  options: Record<string, string[] | string | boolean | undefined>
) {
  if (!options.pattern || !options.total || !options.index) {
    console.warn(
      "Please provide the --pattern and --total and --index options."
    );
    process.exit(1);
  }

  // get files
  const files: string[] = [];
  for (const pattern of options.pattern) {
    const glob = new Glob(pattern);
    files.push(...glob.scanSync());
  }

  let hashToFile: Record<string, string> = {};
  let fileToHash: Record<string, string> = {};
  for (const file of files) {
    const fileHash = hash(file);
    hashToFile[fileHash] = file;
    fileToHash[file] = fileHash;
  }

  // get hash times
  const hashTimesMap = await getTimings(Object.values(fileToHash));
  console.log(hashTimesMap);

  // warn if missing timings
  for (const file of files) {
    if (!hashTimesMap[fileToHash[file]]) {
      console.warn(`No timing found for file: ${file}`);
      hashTimesMap[fileToHash[file]] = DEFAULT_TIMING_IF_MISSING;
    }
  }

  // select files
  const total = parseInt(options.total, 10);
  const index = parseInt(options.index, 10);

  const [selected, estimatedTiming] = splitFiles(hashTimesMap, total);

  console.log(selected[index].map((hash) => hashToFile[hash]).join(" "));
}
