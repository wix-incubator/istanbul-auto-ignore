import fs from "fs";
import {
  BranchNode,
  CommentType,
  CoverageFinalJSON,
  FunctionNode
} from "./types";

const COMMENT = "/* istanbul ignore next */";

function createComment(type: CommentType) {
  return `/* istanbul ignore ${type} */`;
}

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

function addNewLineComment(
  fileContent,
  line,
  commentType: CommentType = "next"
) {
  const newLineIndex = getIndex(fileContent, line, 1);
  return insert(fileContent, `${createComment(commentType)}\n`, newLineIndex);
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
    fileContent = addIgnoreCommentToFunctions(
      fileContent,
      coverage[filePath].fnMap,
      coverage[filePath].f
    );

    fileContent = addIgnoreCommentToBranches(
      fileContent,
      coverage[filePath].branchMap,
      coverage[filePath].b
    );

    fs.writeFileSync(filePath, fileContent, "utf8");
  });
}

function addIgnoreCommentToBranches(fileContent, branchesLocations, b): string {
  let addedLinesCount = 0;

  const isBranchNotCovered = ([branchKey]: [string, BranchNode]): boolean => {
    const [ifBranch, elseBranch] = b[branchKey];
    return (
      (ifBranch === 0 || elseBranch === 0) &&
      !(ifBranch === 0 && elseBranch === 0)
    );
  };

  const getUncoveredBranch = (branchKey: string): "if" | "else" => {
    const [ifBranch] = b[branchKey];
    if (ifBranch === 0) {
      return "if";
    }

    return "else";
  };

  Object.entries(branchesLocations)
    .filter(isBranchNotCovered)
    .forEach(([branchKey, node]: [string, BranchNode]) => {
      const uncoveredBranchType = getUncoveredBranch(branchKey);
      const line = node.loc.start.line + addedLinesCount;
      fileContent = addNewLineComment(fileContent, line, uncoveredBranchType);
      addedLinesCount++;
    });

  return fileContent;
}

function addIgnoreCommentToFunctions(
  fileContent,
  functionDeclarationsLocations,
  f
): string {
  let addedLinesCount = 0;
  let addedCharsToCurrentLine = 0;
  let prevLine = 0;

  const isFunctionNotCovered = ([functionKey]: [
    string,
    FunctionNode
  ]): boolean => {
    return f[functionKey] === 0;
  };

  Object.entries(functionDeclarationsLocations)
    .filter(isFunctionNotCovered)
    .forEach(([, node]: [string, FunctionNode]) => {
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

  return fileContent;
}

//cond-expr - next
//if - depends on use [if0, else0]
