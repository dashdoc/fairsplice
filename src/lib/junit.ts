import { XMLParser } from "fast-xml-parser";

export function parseJunit(xmlString: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "", // to avoid prefixing attributes with @
    parseAttributeValue: true, // turns number strings into numbers
  });
  let junit = parser.parse(xmlString);

  const testCases: Array<{ file: string; time: number }> = [];
  const suites = junit.testsuites.testsuite;

  if (suites.length === undefined) {
    for (const testcase of suites.testcase) {
      testCases.push({ file: testcase.file, time: testcase.time });
    }
    return testCases;
  }

  for (const testsuite of suites) {
    for (const testcase of testsuite.testcase) {
      testCases.push({ file: testcase.file, time: testcase.time });
    }
  }
  return testCases;
}
