import { XMLParser } from "fast-xml-parser";

export function parseJunit(xmlString: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "", // to avoid prefixing attributes with @
    parseAttributeValue: true, // turns number strings into numbers
    isArray: (name) => name === "testcase", // treat all nodes with name "testcase" as arrays
  });
  let junit = parser.parse(xmlString);

  const testCases: Array<{ file: string; time: number }> = [];

  traverseTree(junit, "testcase", (node: any[]) => {
    for (const testcase of node) {
      let file = testcase.file;
      if (file === undefined && testcase.classname !== undefined) {
        file = testcase.classname;
      }
      testCases.push({ file: file, time: testcase.time });
    }
  });

  return testCases;
}

/**
 * Traverse a tree and call a callback for all nodes with a given key.
 */
function traverseTree(
  tree: any,
  stopKey: string,
  callback: (node: any) => void
) {
  for (const [key, value] of Object.entries(tree)) {
    if (key === stopKey) {
      callback(value);
    } else if (typeof value === "object") {
      traverseTree(value, stopKey, callback);
    }
  }
}
