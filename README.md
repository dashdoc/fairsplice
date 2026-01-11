# Fairsplice

Fairsplice is a CLI tool and GitHub Action that optimizes test distribution across parallel workers. It provides CircleCI-style test splitting based on timing data for GitHub Actions.

## Quick Start (GitHub Action)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        index: [0, 1, 2]
    steps:
      - uses: actions/checkout@v4

      - name: Split tests
        id: split
        uses: dashdoc/fairsplice@v1
        with:
          command: split
          pattern: 'tests/**/*.py'
          total: 3
          index: ${{ matrix.index }}
          cache-key: python-tests

      - name: Run tests
        run: pytest ${{ steps.split.outputs.tests }} --junit-xml=junit.xml

      - name: Convert JUnit to timing JSON
        uses: dashdoc/fairsplice@v1
        with:
          command: convert
          from: junit.xml
          to: timing.json

      - uses: actions/upload-artifact@v4
        with:
          name: timing-${{ matrix.index }}
          path: timing.json

  save-timings:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v4

      - name: Merge timings
        uses: dashdoc/fairsplice@v1
        with:
          command: merge
          prefix: 'timing-*/timing'
          cache-key: python-tests
```

That's it! Caching is handled automatically.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CI PIPELINE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐
  │   1. SPLIT PHASE    │
  └─────────────────────┘

  timings (cached)                       fairsplice split
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
    │   ~5.3s           │       │   ~3.9s           │       │   ~5.1s           │
    └─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘
              │                           │                           │
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
                              │   (extracts timings)    │
                              └─────────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │ timings (cached)     │◀─── Auto-cached
                              └──────────────────────┘     for next run
```

**Key concepts:**
- **Split phase**: Distributes test files across workers based on historical timing data
- **Convert phase**: Extracts timing from JUnit XML into timing JSON (one per worker)
- **Merge phase**: Combines timing JSON files from all workers and caches for next run
- **Bin packing**: Assigns tests to balance total execution time (heaviest tests first)
- **Rolling average**: Keeps last 10 timings per test file for predictions

## GitHub Action Reference

### Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `command` | Yes | `split`, `convert`, or `merge` |
| `cache-key` | For split/merge | Cache key for storing timings (use different keys for frontend/backend workflows) |
| `timings-file` | No | JSON file for timings (default: `.fairsplice-timings.json`) |
| `pattern` | For split | Glob pattern to match test files |
| `total` | For split | Total number of workers |
| `index` | For split | Current worker index (0-based) |
| `from` | For convert | JUnit XML file to read |
| `to` | For convert | Timing JSON file to write |
| `prefix` | For merge | Prefix to match timing JSON files |

### Cache Behavior

Fairsplice uses GitHub Actions cache for storing timing history. Important characteristics:

- **Repository-scoped, branch-gated**: Caches are repository-scoped but restore access is gated by branch context
- **Default branch is global**: Caches saved from the default branch (usually `main`) are restorable by all branches
- **Immutable, single-writer**: Each cache key can only be written once; updates require a new key (handled automatically via run ID suffix)
- **Asymmetric cross-branch sharing**: Restore is permissive (branches can read from main), save is restricted (branches can only write to their own scope)

To seed shared timings for all branches, run the workflow on `main` first. Subsequent PRs and feature branches will restore timings from main's cache.

### Outputs

| Output | Description |
|--------|-------------|
| `tests` | Space-separated list of test files (when `index` provided) |
| `buckets` | JSON array of all test buckets |

## CLI Usage

Install with Bun:

```bash
bunx fairsplice
```

### Commands

**Split tests:**
```bash
fairsplice split --timings-file timings.json --pattern "tests/**/*.py" --total 3 --out split.json
```

**Convert JUnit XML to timing JSON:**
```bash
fairsplice convert --from junit.xml --to timing.json
```

**Merge timing results:**
```bash
fairsplice merge --timings-file timings.json --prefix timing-
```

### CLI Options

```
fairsplice split
  --timings-file <file>   JSON file with stored timings
  --pattern <pattern>     Glob pattern for test files (can repeat)
  --total <n>             Number of workers
  --out <file>            Output JSON file

fairsplice convert
  --from <file>           JUnit XML file to read
  --to <file>             Timing JSON file to write

fairsplice merge
  --timings-file <file>   JSON file to store timings
  --prefix <prefix>       Prefix to match timing JSON files
```

## Contributing

```bash
# Run locally
bun run index.ts

# Run tests
bun test
```

## License

MIT
