import { Glob } from "bun";
import { getTimings } from "../backend/redis";
import { splitFiles } from "../lib/splitFiles";
import { hash } from "../lib/hash";
import { DEFAULT_TIMING_IF_MISSING } from "../config";

export async function select({
  patterns,
  total,
  index,
  out,
}: {
  patterns: string[] | undefined;
  total: string | undefined;
  index: string | undefined;
  out: string | undefined;
}) {
  if (!patterns || !total || !index || !out) {
    console.warn(
      "Please provide the --pattern and --total and --index and --out flags."
    );
    process.exit(1);
  }

  // get files
  const files: string[] = [];
  for (const pattern of patterns) {
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

  // warn if missing timings
  for (const file of files) {
    if (!hashTimesMap[fileToHash[file]]) {
      console.warn(`No timing found for file: ${file}`);
      hashTimesMap[fileToHash[file]] = DEFAULT_TIMING_IF_MISSING;
    }
  }

  // select files
  const totalInt = parseInt(total, 10);
  const indexInt = parseInt(index, 10);

  const [selected, estimatedTiming] = splitFiles(hashTimesMap, totalInt);

  console.log(
    `Selected ${selected[indexInt].length} files with an estimated time of ${estimatedTiming[indexInt]}ms (using ${DEFAULT_TIMING_IF_MISSING}ms for files without timing)`
  );

  // write to file
  const filenames =
    selected[indexInt].map((hash) => hashToFile[hash]).join("\n") + "\n";
  await Bun.write(out, filenames);
}
