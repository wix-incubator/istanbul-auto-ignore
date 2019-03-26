import fs from "fs";
import { CoverageFinalJSON, Node } from "./types";

const COMMENT = "/* istanbul ignore next */";

function insert(to: string, what: string, where: number) {
  return to.slice(0, where) + what + to.slice(where, to.length);
}

function getIndex(where: string, line: number, column: number): number {
  const lines = where.split("\n");
  return (
    lines
      .map((l, index) => l.length + (index === lines.length - 1 ? 0 : 1))
      .slice(0, line - 1)
      .reduce((sum, length) => sum + length, 0) +
    column -
    1
  );
}

function addNewLineComment(fileContent, line) {
  const newLineIndex = getIndex(fileContent, line, 1);
  return insert(fileContent, `${COMMENT}\n`, newLineIndex);
}

function addInlineComment(fileContent, line, column) {
  const newLineIndex = getIndex(fileContent, line, column);
  return insert(fileContent, COMMENT, newLineIndex);
}

function beginsOnStartLine(
  fileContent: string,
  line: number,
  column: number
): boolean {
  const placeIndex = getIndex(fileContent, line, column);
  const textBefore = fileContent.substring(0, placeIndex + 1);
  const newLineIndex = textBefore.substring(0, placeIndex).lastIndexOf("\n");
  const begin = fileContent.substring(newLineIndex + 1, placeIndex);
  return /^\s*$/.test(begin);
}

export function run(coveragePath) {
  const coverage: CoverageFinalJSON = JSON.parse(
    fs.readFileSync(coveragePath, "utf8")
  );
  const codeFilesPaths = Object.keys(coverage);

  codeFilesPaths.forEach(filePath => {
    let fileContent = fs.readFileSync(filePath, "utf8");
    let addedLinesCount = 0;
    let addedCharsToCurrentLine = 0;
    let prevLine = 0;
    const functionDelarationsLocations = coverage[filePath].fnMap;

    const isFunctionNotCovered = ([functionKey]: [string, Node]): boolean => {
      return coverage[filePath].f[functionKey] === 0;
    };

    Object.entries(functionDelarationsLocations)
      .filter(isFunctionNotCovered)
      .forEach(([, node]: [string, Node]) => {
        const line = node.decl.start.line + addedLinesCount;
        if (prevLine !== line) {
          addedCharsToCurrentLine = 0;
        }
        const column = node.decl.start.column + addedCharsToCurrentLine;

        if (
          node.name.startsWith("(anonymous_") &&
          !beginsOnStartLine(fileContent, line, column)
        ) {
          fileContent = addInlineComment(fileContent, line, column);
          addedCharsToCurrentLine += COMMENT.length;
        } else {
          fileContent = addNewLineComment(fileContent, line);
          addedLinesCount++;
        }

        prevLine = line;
      });
    fs.writeFileSync(filePath, fileContent, "utf8");
  });
}
