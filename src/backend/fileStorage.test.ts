import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { saveTimings, getTimings } from "./fileStorage";
import { unlink } from "node:fs/promises";
import { TIMINGS_FILE_PATH } from "../config";

describe("fileStorage", () => {
  let originalFileContent: string | null = null;

  beforeEach(async () => {
    // Backup existing file if present
    try {
      originalFileContent = await Bun.file(TIMINGS_FILE_PATH).text();
    } catch {
      originalFileContent = null;
    }
    // Clean up before each test
    try {
      await unlink(TIMINGS_FILE_PATH);
    } catch {
      // File might not exist
    }
  });

  afterEach(async () => {
    // Clean up after test
    try {
      await unlink(TIMINGS_FILE_PATH);
    } catch {
      // File might not exist
    }
    // Restore original file if it existed
    if (originalFileContent !== null) {
      await Bun.write(TIMINGS_FILE_PATH, originalFileContent);
    }
  });

  it("should save and retrieve timings", async () => {
    const timings = {
      "test1.ts": 100,
      "test2.ts": 200,
      "test3.ts": 300,
    };

    await saveTimings(timings);
    const retrieved = await getTimings(["test1.ts", "test2.ts", "test3.ts"]);

    expect(retrieved).toEqual(timings);
  });

  it("should return empty object for non-existent files", async () => {
    const retrieved = await getTimings(["nonexistent.ts"]);
    expect(retrieved).toEqual({});
  });

  it("should average multiple timing entries", async () => {
    // Save first set of timings
    await saveTimings({ "test.ts": 100 });
    // Save second set of timings
    await saveTimings({ "test.ts": 200 });
    // Save third set of timings
    await saveTimings({ "test.ts": 300 });

    const retrieved = await getTimings(["test.ts"]);
    // Average of [300, 200, 100] = 200
    expect(retrieved["test.ts"]).toBe(200);
  });

  it("should handle partial file requests", async () => {
    await saveTimings({
      "test1.ts": 100,
      "test2.ts": 200,
    });

    const retrieved = await getTimings(["test1.ts", "nonexistent.ts"]);
    expect(retrieved).toEqual({ "test1.ts": 100 });
  });

  it("should persist data to JSON file", async () => {
    await saveTimings({ "myfile.ts": 42 });

    // Verify file exists and contains valid JSON
    const content = await Bun.file(TIMINGS_FILE_PATH).text();
    const data = JSON.parse(content);

    expect(data.version).toBe(1);
    expect(data.timings["myfile.ts"]).toEqual([42]);
  });
});
