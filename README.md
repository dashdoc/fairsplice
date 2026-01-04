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

  .fairsplice-timings.json          fairsplice split
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
  │   2. SAVE PHASE     │                 │
  └─────────────────────┘                 │
                                          ▼
                              ┌─────────────────────────┐
                              │    fairsplice save      │
                              │    --from junit.xml     │
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
                              │ .fairsplice-timings  │
                              │ Updated with new     │
                              │ timing data          │◀─── Cached/committed
                              └──────────────────────┘     for next run
```

**Key concepts:**
- **Split phase**: Before tests run, fairsplice distributes test files across workers based on historical timing data
- **Save phase**: After tests complete, fairsplice extracts timing from JUnit XML and updates the timings file
- **Bin packing**: Tests are assigned to workers to balance total execution time (heaviest tests first)
- **Rolling average**: Keeps last 10 timings per test file, uses average for predictions

## Installation

This project is built using [Bun](https://bun.sh).

Ensure you have Bun installed.
To launch it, run

```bash
bunx fairsplice
```

## Configuration

Fairsplice stores timings in a local JSON file (default: `.fairsplice-timings.json` in the current directory).

You can customize the file path using the `FAIRSPLICE_TIMINGS_FILE` environment variable:

```bash
export FAIRSPLICE_TIMINGS_FILE='/path/to/my-timings.json'
```

### Using with GitHub Actions

To persist timings across CI runs, you can use GitHub Actions cache:

```yaml
- name: Cache test timings
  uses: actions/cache@v4
  with:
    path: .fairsplice-timings.json
    key: fairsplice-timings-${{ github.ref }}
    restore-keys: |
      fairsplice-timings-
```

Alternatively, you can commit the timings file to your repository for simpler persistence.

## Usage

Fairsplice supports two main commands: `save` and `split`.

### Saving test results

To save test results:

```bash
fairsplice save --from <file>
```

- `--from <file>`: Specify the file path to read test results from.

Example:

```bash
fairsplice save --from results/junit.xml
```

### Splitting test cases

To split test cases for execution:

```bash
fairsplice split --pattern "<pattern>" [--pattern "<anotherPattern>" ...] --total <total> --out <file> --replace-from <string> --replace-to <string> [--replace-from <other> --replace-to <other>]
```

- `--pattern "<pattern>"`: Pattern to match test files. Can be used multiple times to specify multiple patterns.
- `--total <total>`: Total number of workers in the test environment.
- `--out <file>`: File to write split test files to (newline separated)
- `--replace-from <string>`: Substring to replace in the file paths (can be used multiple times)
- `--replace-to <string>`: Replacement for the substring (can be used multiple times but must match the number of --replace-from)

Example:

```bash
fairsplice split --pattern "test_*.py" --pattern "tests*.py" --total 3 --out split.json
```

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
