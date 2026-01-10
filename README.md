# Fairsplice

**Warning: this project is still in very early development!**

Fairsplice is a CLI tool designed to optimize test distribution across multiple workers. By intelligently splitting and saving test cases, Fairsplice ensures a balanced workload distribution for your CI/CD pipelines, making tests run time more predictable.

We found Github Actions lacking when compared to CircleCI which has [tests splitting](https://circleci.com/docs/parallelism-faster-jobs/#how-test-splitting-works) based on timings.

There are a number of projects like [Split tests](https://github.com/marketplace/actions/split-tests) but they require uploading and downloading Junit XML files and merging them, or committing the Junit files to have them when running the tests.

This tool stores test timings in a local JSON file, keeping the last 10 timings for each test file and using the average for splitting. No external database required!

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CI PIPELINE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐
  │   1. SPLIT PHASE    │
  └─────────────────────┘

  timings.json                         fairsplice split
  ┌──────────────────────┐         ┌─────────────────┐
  │ {                    │         │                 │
  │   "test_a.py": [2.1],│ ──────▶ │  Load timings   │
  │   "test_b.py": [5.3],│         │  + glob files   │
  │   "test_c.py": [1.8] │         │                 │
  │ }                    │         └────────┬────────┘
  └──────────────────────┘                  │
                                            ▼
                              ┌─────────────────────────┐
                              │   Distribute tests by   │
                              │   timing (bin packing)  │
                              └─────────────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
    ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
    │    Worker 0       │       │    Worker 1       │       │    Worker 2       │
    │  ["test_b.py"]    │       │  ["test_a.py",    │       │  ["test_c.py"]    │
    │   ~5.3s           │       │   "test_c.py"]    │       │   ~1.8s           │
    └─────────┬─────────┘       │   ~3.9s           │       └─────────┬─────────┘
              │                 └─────────┬─────────┘                 │
              ▼                           ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
    │   Run tests       │       │   Run tests       │       │   Run tests       │
    │   Output JUnit    │       │   Output JUnit    │       │   Output JUnit    │
    └─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘
              │                           │                           │
              └───────────────────────────┴───────────────────────────┘
                                          │
  ┌─────────────────────┐                 │
  │   2. MERGE PHASE    │                 │
  └─────────────────────┘                 │
                                          ▼
                              ┌─────────────────────────┐
                              │   fairsplice merge      │
                              │   --prefix junit-       │
                              └─────────────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────────┐
                              │  Extract timings from   │
                              │  JUnit XML results      │
                              └─────────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │ timings.json         │
                              │ Updated with new     │
                              │ timing data          │◀─── Cached/committed
                              └──────────────────────┘     for next run
```

**Key concepts:**
- **Split phase**: Before tests run, fairsplice distributes test files across workers based on historical timing data
- **Merge phase**: After tests complete, fairsplice extracts timing from JUnit XML and updates the timings file
- **Bin packing**: Tests are assigned to workers to balance total execution time (heaviest tests first)
- **Rolling average**: Keeps last 10 timings per test file, uses average for predictions

## Installation

This project is built using [Bun](https://bun.sh).

Ensure you have Bun installed.
To launch it, run

```bash
bunx fairsplice
```

## Usage

Fairsplice has two commands: `merge` and `split`. Both require a `--timings-file` parameter.

### Merging test results

Save test timings from JUnit XML file(s):

```bash
fairsplice merge --timings-file <timings.json> --prefix <prefix>
```

- `--timings-file <file>`: JSON file to store timings
- `--prefix <prefix>`: Prefix to match JUnit XML files

Example:

```bash
# Merges junit-0.xml, junit-1.xml, junit-2.xml, etc.
fairsplice merge --timings-file timings.json --prefix junit-
```

### Splitting test cases

Split test files across workers based on historical timings:

```bash
fairsplice split --timings-file <timings.json> --pattern "<pattern>" --total <total> --out <file>
```

- `--timings-file <file>`: JSON file with stored timings
- `--pattern "<pattern>"`: Pattern to match test files (can be used multiple times)
- `--total <total>`: Total number of workers
- `--out <file>`: File to write split result to (JSON array of arrays)
- `--replace-from <string>`: (Optional) Substring to replace in file paths
- `--replace-to <string>`: (Optional) Replacement string

Example:

```bash
fairsplice split --timings-file timings.json --pattern "test_*.py" --total 3 --out split.json
```

## Using with GitHub Actions

To persist timings across CI runs, use GitHub Actions cache:

```yaml
- name: Cache test timings
  uses: actions/cache@v4
  with:
    path: timings.json
    key: fairsplice-timings-${{ github.ref }}
    restore-keys: |
      fairsplice-timings-

- name: Split tests
  run: bunx fairsplice split --timings-file timings.json --pattern "tests/**/*.py" --total 3 --out split.json
```

Alternatively, you can commit the timings file to your repository for simpler persistence.

## Help

For a detailed list of commands and options, use the help command:

```bash
fairsplice --help
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

### Running locally

Launch the development version with:

```bash
bun run index.ts
```

### Running tests

Launch the following command to run tests:

```bash
bun test [--watch]
```

## License

Fairsplice is open-source software licensed under the MIT license.
