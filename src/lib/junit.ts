import { XMLParser } from "fast-xml-parser";

export function parseJunit(xmlString: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "", // to avoid prefixing attributes with @
    parseAttributeValue: true, // turns number strings into numbers
  });
  let junit = parser.parse(xmlString);

  return junit.testsuites.testsuite.testcase;
}
