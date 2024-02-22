import { Glob } from "bun";
import { getTimings } from "../backend/redis";
import { splitFiles } from "../lib/splitFiles";
import { DEFAULT_TIMING_IF_MISSING } from "../config";

export async function select({
  patterns,
  total,
  index,
  replaceFrom,
  replaceTo,
  out,
}: {
  patterns: string[] | undefined;
  total: string | undefined;
  index: string | undefined;
  replaceFrom: string[] | undefined;
  replaceTo: string[] | undefined;
  out: string | undefined;
}) {
  if (!patterns || !total || !index || !out) {
    console.warn(
      "Please provide the --pattern and --total and --index and --out flags."
    );
    process.exit(1);
  }

  if (replaceFrom && replaceTo && replaceFrom.length !== replaceTo.length) {
    console.warn(
      "The number of --replace-from and --replace-to flags must match."
    );
    process.exit(1);
  }

  // get files
  const files: string[] = [];
  for (const pattern of patterns) {
    const glob = new Glob(pattern);
    files.push(...glob.scanSync());
  }

  // replace strings
  if (replaceFrom && replaceTo) {
    for (let i = 0; i < replaceFrom.length; i++) {
      const from = replaceFrom[i];
      const to = replaceTo[i];
      files.forEach((file, index) => {
        files[index] = file.replace(from, to);
      });
    }
  }

  // get file times
  const filesTimesMap = await getTimings(files);

  // warn if missing timings
  for (const file of files) {
    if (!filesTimesMap[file]) {
      console.warn(`No timing found for file: ${file}`);
      filesTimesMap[file] = DEFAULT_TIMING_IF_MISSING;
    }
  }

  // select files
  const totalInt = parseInt(total, 10);
  const indexInt = parseInt(index, 10);

  const [selected, estimatedTiming] = splitFiles(filesTimesMap, totalInt);

  console.log(
    `Selected ${selected[indexInt].length} files with an estimated time of ${estimatedTiming[indexInt]}ms (using ${DEFAULT_TIMING_IF_MISSING}ms for files without timing)`
  );

  // write to file
  const filenames = selected[indexInt].join(" ") + "\n";
  await Bun.write(out, filenames);
}
