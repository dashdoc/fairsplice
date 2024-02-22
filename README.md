# Fairsplice

Fairsplice is a CLI tool designed to optimize test distribution across multiple workers. By intelligently selecting and saving test cases, Fairsplice ensures balanced workload distribution for your CI/CD pipelines, making tests run time more predictable.

We found Github Actions lacking when compared to CircleCI which has [tests splitting](https://circleci.com/docs/parallelism-faster-jobs/#how-test-splitting-works) based on timings.

There are a number of projects like [Split tests](https://github.com/marketplace/actions/split-tests) but they require uploading and downloading Junit XML files and merging them, or committing the Junit files to have them when running the tests.

This tool uses instead a Redis server to store the last 10 timings for each test file and uses the average of these to select tests. It is easy to setup if you have a Redis server running.

## Installation

This project is built using [Bun](https://bun.sh) and [Redis](https://redis.io/).

Ensure you have Bun installed.
To launch it, run

```bash
bunx fairsplice
```

## Configuration

Before using Fairsplice, set the environment variable `FAIRSPLICE_REDIS_URL` to your Redis server URL. This is necessary for storing and retrieving test case information.

```bash
export FAIRSPLICE_REDIS_URL='redis://myuser:mypassword@your-redis-url.upstash.io:33683'
```

## Usage

Fairsplice supports two main commands: `save` and `select`.

### Saving Test Results

To save test results:

```bash
fairsplice save --from <file>
```

- `--from <file>`: Specify the file path to read test results from.

Example:

```bash
fairsplice save --from results/junit.xml
```

### Selecting Test Cases

To select test cases for execution:

```bash
fairsplice select --pattern "<pattern>" [--pattern "<anotherPattern>" ...] --total <total> --index <index>
```

- `--pattern "<pattern>"`: Pattern to match test files. Can be used multiple times to specify multiple patterns.
- `--total <total>`: Total number of workers in the test environment.
- `--index <index>`: Index of the current worker (0-based).
- `--out <file>`: File to write selected test files to (newline separated)
- `--replace-from <string>`: Substring to replace in the file paths (can be used multiple times)
- `--replace-to <string>`: Replacement for the substring (can be used multiple times but must match the number of --replace-from)

Example:

```bash
fairsplice select --pattern "test_*.py" --pattern "tests*.py" --total 3 --index 1
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
