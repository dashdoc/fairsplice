import { describe, it, expect } from "bun:test";

import { parseJunit } from "./junit";

describe("parseJunit", () => {
  it("should parse junit xml", () => {
    const xmlString = `
      <?xml version="1.0" encoding="utf-8"?>
      <testsuites>
        <testsuite name="suite1">
          <testcase name="test1" file="onefile.ts" classname="class1" time="0.1"/>
          <testcase name="test2" file="onefile.ts" classname="class2" time="0.2"/>
        </testsuite>
        <testsuite name="suite2">
          <testcase name="test3" file="otherfile.ts" classname="class3" time="0.3"/>
          <testcase name="test4" file="otherfile.ts" classname="class4" time="0.4"/>
        </testsuite>
      </testsuites>
    `;

    const testCases = parseJunit(xmlString);
    expect(testCases).toEqual([
      { file: "onefile.ts", time: 0.1 },
      { file: "onefile.ts", time: 0.2 },
      { file: "otherfile.ts", time: 0.3 },
      { file: "otherfile.ts", time: 0.4 },
    ]);
  });

  it("should work with django pytest junit xml", async () => {
    const xmlString = await Bun.file(
      "src/lib/fixtures/django-pytest.junit.xml"
    ).text();
    const testCases = parseJunit(xmlString);
    expect(testCases).toHaveLength(31);
    expect(testCases[0]).toEqual({
      file: "myapp/tests/tests_group_view.py",
      time: 107.427,
    });
  });

  it("should work with playwright junit xml", async () => {
    const xmlString = await Bun.file(
      "src/lib/fixtures/playwright.junit.xml"
    ).text();
    const testCases = parseJunit(xmlString);
    expect(testCases).toHaveLength(6);
    expect(testCases[0]).toEqual({
      file: "flow/slot-booking/bookSlotAsSiteOwner.spec.ts",
      time: 13.651,
    });
  });
});
