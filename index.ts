#!/usr/bin/env bun

import { merge } from "./src/commands/merge";
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
    // merge options
    prefix: {
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
Usage: fairsplice [merge|split] [options]

fairsplice merge
----------------
Save test timings from JUnit XML file(s).

Required options:
    --timings-file <file>   JSON file to store timings
    --prefix <prefix>       Prefix to match JUnit XML files (e.g., "junit-" matches junit-*.xml)

Example: fairsplice merge --timings-file timings.json --prefix junit-


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

if (command === "merge") {
  if (!values["timings-file"] || !values.prefix) {
    console.error(
      "Error: --timings-file and --prefix are required for the merge command."
    );
    process.exit(1);
  }
  await merge({ prefix: values.prefix, timingsFile: values["timings-file"] });
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
    `Invalid command "${command}". Available commands: merge, split.`
  );
  process.exit(1);
}
