import { describe, it, expect } from "bun:test";

// Fast tests - minimal delay
describe("Fast test suite", () => {
  it("should complete quickly - test 1", async () => {
    await Bun.sleep(50);
    expect(1 + 1).toBe(2);
  });

  it("should complete quickly - test 2", async () => {
    await Bun.sleep(30);
    expect(true).toBe(true);
  });

  it("should complete quickly - test 3", async () => {
    await Bun.sleep(20);
    expect("hello").toContain("ell");
  });
});
