#!/usr/bin/env bun

import { convert } from "./src/commands/convert";
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
    // convert options
    from: {
      type: "string",
    },
    to: {
      type: "string",
    },
    ["path-prefix"]: {
      type: "string",
    },
    // merge options
    ["timings-file"]: {
      type: "string",
    },
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
Usage: fairsplice [split|convert|merge] [options]

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


fairsplice convert
------------------
Convert JUnit XML to timing JSON (for a single worker).

Required options:
    --from <file>           JUnit XML file to read
    --to <file>             Timing JSON file to write

Optional:
    --path-prefix <prefix>  Prefix to prepend to all file paths (e.g., "src/tests/")

Example: fairsplice convert --from junit.xml --to timing.json --path-prefix "frontends/apps/e2e/"


fairsplice merge
----------------
Merge timing JSON files and save to timings history.

Required options:
    --timings-file <file>   JSON file to store timing history
    --prefix <prefix>       Prefix to match timing JSON files

Example: fairsplice merge --timings-file timings.json --prefix timing-
  `);
  process.exit(0);
}

if (command === "split") {
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
} else if (command === "convert") {
  if (!values.from || !values.to) {
    console.error(
      "Error: --from and --to are required for the convert command."
    );
    process.exit(1);
  }
  await convert({ from: values.from, to: values.to, pathPrefix: values["path-prefix"] });
  process.exit(0);
} else if (command === "merge") {
  if (!values["timings-file"] || !values.prefix) {
    console.error(
      "Error: --timings-file and --prefix are required for the merge command."
    );
    process.exit(1);
  }
  await merge({ prefix: values.prefix, timingsFile: values["timings-file"] });
  process.exit(0);
} else {
  console.error(
    `Invalid command "${command}". Available commands: split, convert, merge.`
  );
  process.exit(1);
}
