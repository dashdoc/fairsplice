import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { saveTimings, getTimings } from "./fileStorage";
import { unlink } from "node:fs/promises";

const TEST_TIMINGS_FILE = "/tmp/fairsplice-test-timings.json";

describe("fileStorage", () => {
  beforeEach(async () => {
    // Clean up before each test
    try {
      await unlink(TEST_TIMINGS_FILE);
    } catch {
      // File might not exist
    }
  });

  afterEach(async () => {
    // Clean up after test
    try {
      await unlink(TEST_TIMINGS_FILE);
    } catch {
      // File might not exist
    }
  });

  it("should save and retrieve timings", async () => {
    const timings = {
      "test1.ts": 100,
      "test2.ts": 200,
      "test3.ts": 300,
    };

    await saveTimings(TEST_TIMINGS_FILE, timings);
    const retrieved = await getTimings(TEST_TIMINGS_FILE, [
      "test1.ts",
      "test2.ts",
      "test3.ts",
    ]);

    expect(retrieved).toEqual(timings);
  });

  it("should return empty object for non-existent files", async () => {
    const retrieved = await getTimings(TEST_TIMINGS_FILE, ["nonexistent.ts"]);
    expect(retrieved).toEqual({});
  });

  it("should average multiple timing entries", async () => {
    // Save first set of timings
    await saveTimings(TEST_TIMINGS_FILE, { "test.ts": 100 });
    // Save second set of timings
    await saveTimings(TEST_TIMINGS_FILE, { "test.ts": 200 });
    // Save third set of timings
    await saveTimings(TEST_TIMINGS_FILE, { "test.ts": 300 });

    const retrieved = await getTimings(TEST_TIMINGS_FILE, ["test.ts"]);
    // Average of [300, 200, 100] = 200
    expect(retrieved["test.ts"]).toBe(200);
  });

  it("should handle partial file requests", async () => {
    await saveTimings(TEST_TIMINGS_FILE, {
      "test1.ts": 100,
      "test2.ts": 200,
    });

    const retrieved = await getTimings(TEST_TIMINGS_FILE, [
      "test1.ts",
      "nonexistent.ts",
    ]);
    expect(retrieved).toEqual({ "test1.ts": 100 });
  });

  it("should persist data to JSON file", async () => {
    await saveTimings(TEST_TIMINGS_FILE, { "myfile.ts": 42 });

    // Verify file exists and contains valid JSON
    const content = await Bun.file(TEST_TIMINGS_FILE).text();
    const data = JSON.parse(content);

    expect(data.version).toBe(1);
    expect(data.timings["myfile.ts"]).toEqual([42]);
  });
});
