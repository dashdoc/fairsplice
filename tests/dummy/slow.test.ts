import { describe, it, expect } from "bun:test";

// Slow tests - longer delays
describe("Slow test suite", () => {
  it("should take longer - test 1", async () => {
    await Bun.sleep(300);
    expect(Array.isArray([])).toBe(true);
  });

  it("should take longer - test 2", async () => {
    await Bun.sleep(350);
    expect(typeof "string").toBe("string");
  });

  it("should take longer - test 3", async () => {
    await Bun.sleep(250);
    expect(null).toBeNull();
  });
});
