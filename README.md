# FairSplice

FairSplice is a CLI tool designed to optimize test distribution across multiple workers. By intelligently selecting and saving test cases, FairSplice ensures balanced workload distribution for your CI/CD pipelines, making tests run time more predictable.

## Features

- **Save Test Results**: Easily save your test results from a specified file to be analyzed and distributed.
- **Select Test Cases**: Dynamically select test cases based on patterns, supporting multiple environments with varying numbers of workers.

This project is built using [Bun](https://bun.sh) and [Redis](https://redis.io/).

## Installation

Ensure you have Bun installed.

Then run the following command to install dependencies:

```bash
bun install
```

To build a binary, you can run:

```bash
bun compile
```

This will create a `fairsplice` binary in the current directory.


## Configuration

Before using FairSplice, set the environment variable `FAIRSPLICE_REDIS_URL` to your Redis server URL. This is necessary for storing and retrieving test case information.

```bash
export FAIRSPLICE_REDIS_URL='redis://myuser:mypassword@your-redis-url.upstash.io:33683'
```

## Usage

FairSplice supports two main commands: `save` and `select`.

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

FairSplice is open-source software licensed under the MIT license.
