#!/usr/bin/env bun

import { save } from "./src/commands/save";
import { split } from "./src/commands/split";
import { parseArgs } from "util";

const { positionals, values } = parseArgs({
  args: Bun.argv,
  options: {
    help: {
      type: "boolean",
      short: "h",
    },
    // common options
    ["timings-file"]: {
      type: "string",
    },
    // save options
    from: {
      type: "string",
    },
    // split options
    pattern: {
      type: "string",
      multiple: true,
    },
    total: {
      type: "string",
    },
    ["replace-from"]: {
      type: "string",
      multiple: true,
    },
    ["replace-to"]: {
      type: "string",
      multiple: true,
    },
    out: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

const command = positionals[2];

if (values.help || !command) {
  console.log(`
Usage: fairsplice [save|split] [options]

fairsplice save
---------------
Save test timings from a JUnit XML file.

Required options:
    --timings-file <file>   JSON file to store timings
    --from <file>           JUnit XML file to read test results from

Example: fairsplice save --timings-file timings.json --from results/junit.xml


fairsplice split
----------------
Split test files across workers based on historical timings.

Required options:
    --timings-file <file>       JSON file with stored timings
    --pattern <pattern>         Pattern to match test files (can be used multiple times)
    --total <total>             Total number of workers
    --out <file>                File to write split result to (JSON)

Optional:
    --replace-from <string>     Substring to replace in file paths (can be used multiple times)
    --replace-to <string>       Replacement string (must match number of --replace-from)

Example: fairsplice split --timings-file timings.json --pattern "test_*.py" --total 3 --out split.json
  `);
  process.exit(0);
}

if (command === "save") {
  if (!values["timings-file"] || !values.from) {
    console.error(
      "Error: --timings-file and --from are required for the save command."
    );
    process.exit(1);
  }
  await save({ from: values.from, timingsFile: values["timings-file"] });
  process.exit(0);
} else if (command === "split") {
  if (
    !values["timings-file"] ||
    !values.pattern ||
    !values.total ||
    !values.out
  ) {
    console.error(
      "Error: --timings-file, --pattern, --total, and --out are required for the split command."
    );
    process.exit(1);
  }
  await split({
    patterns: values.pattern,
    total: values.total,
    out: values.out,
    replaceFrom: values["replace-from"],
    replaceTo: values["replace-to"],
    timingsFile: values["timings-file"],
  });
  process.exit(0);
} else {
  console.error(
    `Invalid command "${command}". Available commands: save, split.`
  );
  process.exit(1);
}
