import { describe, it, expect } from "bun:test";

// Variable timing tests
describe("Variable timing test suite", () => {
  it("should handle variable timing - quick", async () => {
    await Bun.sleep(25);
    expect(Number.isInteger(42)).toBe(true);
  });

  it("should handle variable timing - medium", async () => {
    await Bun.sleep(175);
    expect(Object.keys({ a: 1, b: 2 })).toEqual(["a", "b"]);
  });

  it("should handle variable timing - slow", async () => {
    await Bun.sleep(400);
    expect(new Date()).toBeInstanceOf(Date);
  });
});
