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

Make sure the environment variable FAIRSPLICE_REDIS_URL is set.

fairsplice save
---------------
Available options:
    --from <file>       File to read test results from

Example: fairsplice save --from results/junit.xml


fairsplice split
-----------------
Available options:
    --pattern <pattern>     Pattern to match test files (can be used multiple times)
    --total <total>         Total number of workers
    --out <file>            File to write test files to (JSON)
    --replace-from <string> Substring to replace in the file paths (can be used multiple times)
    --replace-to <string>   Replacement for the substring (can be used multiple times but must match the number of --replace-from)

Example: fairsplice split --pattern "test_*.py" --pattern "tests*.py" --total 3 --out split.json
  `);
  process.exit(0);
}

if (!process.env.FAIRSPLICE_REDIS_URL) {
  console.error(
    "Please set the FAIRSPLICE_REDIS_URL environment variable to use fairsplice."
  );
  process.exit(1);
}

if (command === "save") {
  await save({ from: values.from });
  process.exit(0);
} else if (command === "split") {
  await split({
    patterns: values.pattern,
    total: values.total,
    out: values.out,
    replaceFrom: values["replace-from"],
    replaceTo: values["replace-to"],
  });
  process.exit(0);
} else {
  console.error(
    `Invalid command "${command}". Available commands: save, split.`
  );
  process.exit(1);
}
