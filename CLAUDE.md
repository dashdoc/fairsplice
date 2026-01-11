# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fairsplice is a TypeScript/Bun CLI tool and GitHub Action that optimizes test distribution across parallel workers. It provides CircleCI-style test splitting based on historical timing data for GitHub Actions.

## Commands

```bash
# Run locally
bun run index.ts

# Run all tests
bun test

# Run tests in src directory
bun test src/

# Run a specific test file
bun test src/lib/splitFiles.test.ts

# Compile to standalone binary
bun build ./index.ts --compile --outfile fairsplice
```

## Architecture

**Entry Point**: `index.ts` - CLI with three commands: `split`, `convert`, `merge`

**Source Structure**:
- `src/commands/` - CLI command implementations
  - `split.ts` - Distributes test files across workers using bin packing
  - `merge.ts` - Aggregates timing JSON files and updates history
  - `convert.ts` - Converts JUnit XML to timing JSON
- `src/lib/` - Core algorithms
  - `splitFiles.ts` - Greedy bin packing algorithm (assigns heaviest tests first to balance workload)
  - `junit.ts` - JUnit XML parser using `fast-xml-parser`
  - `average.ts` - Timing averaging utility
- `src/backend/` - Storage layer
  - `fileStorage.ts` - JSON-based timing persistence with rolling window of last 10 timings per file
- `src/config.ts` - Constants (`NUMBER_OF_TIMINGS_TO_KEEP=10`, `DEFAULT_TIMING_IF_MISSING=10000ms`)

**GitHub Action**: `action.yml` - Composite action wrapping the CLI with automatic cache handling

**Data Flow**:
1. `split` loads cached timings, globs test files, applies bin packing, outputs bucket assignments
2. Tests run in parallel workers, each outputting JUnit XML
3. `convert` transforms JUnit XML to timing JSON (one per worker)
4. `merge` aggregates timing JSONs into cached timings history

## Testing

Tests are co-located with source files (`*.test.ts`). Test fixtures for JUnit parsing are in `src/lib/fixtures/`.

The CI workflow (`.github/workflows/test.yml`) runs unit tests plus a 3-worker integration test that exercises the full split→run→convert→merge pipeline.
