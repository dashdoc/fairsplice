export function splitFiles(
  fileTimesMap: Record<string, number /* in milliseconds */>,
  splitTotal: number
): [string[][], number[]] {
  const buckets: string[][] = Array.from({ length: splitTotal }, () => []);
  const bucketTimes: number[] = Array.from({ length: splitTotal }, () => 0);

  // Build a sorted list of files
  const fileTimesList = Object.entries(fileTimesMap).sort(
    (a, b) => b[1] - a[1]
  );

  for (const [file, time] of fileTimesList) {
    // Find bucket with min weight
    const minBucket = bucketTimes.reduce(
      (minIndex, currentTime, index, arr) =>
        currentTime < arr[minIndex] ? index : minIndex,
      0
    );
    // Add file to bucket
    buckets[minBucket].push(file);
    bucketTimes[minBucket] += time;
  }

  return [buckets, bucketTimes];
}
