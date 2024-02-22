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

  it("should have a stable output no matter the order", () => {
    const fileTimesMap1 = {
      a: 10,
      e: 50,
      b: 20,
      c: 30,
      d: 40,
    };
    const fileTimesMap2 = {
      d: 40,
      a: 10,
      e: 50,
      c: 30,
      b: 20,
    };
    const [buckets1, bucketTimes1] = splitFiles(fileTimesMap1, 2);
    const [buckets2, bucketTimes2] = splitFiles(fileTimesMap2, 2);
    expect(bucketTimes1).toEqual(bucketTimes2);
    expect(buckets1).toEqual(buckets2);
  });
});
