# fairsplice

```
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
```