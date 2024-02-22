#!/usr/bin/env bun

import { save } from "./src/commands/save";
import { select } from "./src/commands/select";
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
    // select options
    pattern: {
      type: "string",
      multiple: true,
    },
    total: {
      type: "string",
    },
    index: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

const command = positionals[2];

if (values.help || !command) {
  console.log(`
Usage: fairsplice [save|select] [options]

Make sure the environment variable FAIRSPLICE_REDIS_URL is set.

fairsplice save
---------------
Available options:
    --from <file>       File to read test results from

Example: fairsplice save --from results/junit.xml


fairsplice select
-----------------
Available options:
    --pattern <pattern>  Pattern to match test files (can be used multiple times)
    --total <total>      Total number of workers
    --index <index>      Worker index

Example: fairsplice select --pattern "test_*.py" --pattern "tests*.py" --total 3 --index 1
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
  await save(values);
  process.exit(0);
} else if (command === "select") {
  await select(values);
  process.exit(0);
} else {
  console.error(
    `Invalid command "${command}". Available commands: save, select.`
  );
  process.exit(1);
}
