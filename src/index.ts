import fs from "fs";
import { CoverageFinalJSON } from "./types";

function insert(to: string, what: string, where: number) {
  return to.slice(0, where) + what + to.slice(where, to.length);
}

function getIndex(where: string, line: number, column: number): number {
  const lines = where.split("\n");
  return (
    lines
      .map((l, index) => l.length + (index === lines.length - 1 ? 0 : 1))
      .slice(0, line)
      .reduce((sum, length) => sum + length) + column
  );
}

function addComment(fileContent, line) {
  const newLineIndex = getIndex(fileContent, line - 1, 0);
  return insert(fileContent, "/* istanbul ignore next */\n", newLineIndex);
}

export function run(coveragePath) {
  const coverage: CoverageFinalJSON = JSON.parse(
    fs.readFileSync(coveragePath, "utf8")
  );
  const files = Object.keys(coverage);

  files.forEach(file => {
    const fileContent = fs.readFileSync(file, "utf8");
    const fnMap = coverage[file].fnMap;
    Object.entries(fnMap).forEach(([key, fn]) => {
      // @ts-ignore
      const f = coverage[file].f[key];
      if (f === 0) {
        const newContent = addComment(fileContent, fn.decl.start.line);

        fs.writeFileSync(file, newContent, "utf8");
      }
    });
  });
}
