import { describe, it, expect } from "bun:test";

// Medium duration tests
describe("Medium test suite", () => {
  it("should take moderate time - test 1", async () => {
    await Bun.sleep(150);
    expect([1, 2, 3]).toHaveLength(3);
  });

  it("should take moderate time - test 2", async () => {
    await Bun.sleep(200);
    expect({ a: 1 }).toHaveProperty("a");
  });

  it("should take moderate time - test 3", async () => {
    await Bun.sleep(100);
    expect(Math.max(1, 2, 3)).toBe(3);
  });
});
