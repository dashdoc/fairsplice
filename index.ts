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

if (values.help) {
  console.log(`
Usage: fairsplice [save|select] [options]

Make sure the environment variables FAIRSPLICE_BACKEND_URL and FAIRSPLICE_BACKEND_KEY are set.

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

const command = positionals[2];

if (command === "save") {
  save(values);
} else if (command === "select") {
  select(values);
} else {
  console.error(
    `Invalid command "${command}". Available commands: save, select.`
  );
  process.exit(1);
}
