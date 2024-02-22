import { describe, expect, it } from "bun:test";

import { splitFiles } from "./splitFiles";

describe("splitFiles", () => {
  it("should split files into buckets of equal timing", () => {
    const fileTimesMap = {
      a: 10,
      b: 20,
      c: 30,
      d: 40,
      e: 50,
    };
    const splitTotal = 3;
    const [buckets, bucketTimes] = splitFiles(fileTimesMap, splitTotal);
    expect(bucketTimes).toEqual([50, 50, 50]);
    expect(buckets).toEqual([["e"], ["d", "a"], ["c", "b"]]);
  });

  it("should work with empty fileTimesMap", () => {
    const fileTimesMap = {};
    const splitTotal = 3;
    const [buckets, bucketTimes] = splitFiles(fileTimesMap, splitTotal);
    expect(bucketTimes).toEqual([0, 0, 0]);
    expect(buckets).toEqual([[], [], []]);
  });

  it("should work with 1 file", () => {
    const fileTimesMap = {
      a: 10,
    };
    const splitTotal = 3;
    const [buckets, bucketTimes] = splitFiles(fileTimesMap, splitTotal);
    expect(bucketTimes).toEqual([10, 0, 0]);
    expect(buckets).toEqual([["a"], [], []]);
  });
});
