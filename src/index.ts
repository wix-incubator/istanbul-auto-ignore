import fs from 'fs';
import {
  BranchNode,
  CommentType,
  CoverageFinalJSON,
  FunctionNode
} from './types';
import { TextChanges } from './TextChanges';

function createComment(type: CommentType) {
  return `/* istanbul ignore ${type} */`;
}

export function run(coveragePath) {
  const coverage: CoverageFinalJSON = JSON.parse(
    fs.readFileSync(coveragePath, 'utf8')
  );
  const codeFilesPaths = Object.keys(coverage);

  codeFilesPaths
    .map(filePath => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return { textChanges: new TextChanges(fileContent), filePath };
    })
    .map(({ textChanges, filePath }) => {
      addIgnoreCommentToFunctions(
        textChanges,
        coverage[filePath].fnMap,
        coverage[filePath].f
      );

      addIgnoreCommentToBranches(
        textChanges,
        coverage[filePath].branchMap,
        coverage[filePath].b
      );
      return { textChanges, filePath };
    })
    .forEach(({ textChanges, filePath }) => {
      fs.writeFileSync(filePath, textChanges.getText(), 'utf8');
    });
}

function addIgnoreCommentToBranches(textChanges, branchesLocations, b) {
  const isBranchNotCovered = ([branchKey]: [string, BranchNode]): boolean => {
    const [ifBranch, elseBranch] = b[branchKey];
    return (
      (ifBranch === 0 || elseBranch === 0) &&
      !(ifBranch === 0 && elseBranch === 0)
    );
  };

  const getUncoveredBranch = (branchKey: string): 'if' | 'else' => {
    const [ifBranch] = b[branchKey];
    return ifBranch === 0 ? 'if' : 'else';
  };

  Object.entries(branchesLocations)
    .filter(isBranchNotCovered)
    .forEach(([branchKey, node]: [string, BranchNode]) => {
      const uncoveredBranchType = getUncoveredBranch(branchKey);

      if (node.type === 'cond-expr') {
        textChanges.insert(
          createComment('next'),
          node.loc.start.line,
          node.loc.start.column
        );
      } else {
        textChanges.insertLine(
          createComment(uncoveredBranchType),
          node.loc.start.line
        );
      }
    });
}

function addIgnoreCommentToFunctions(
  textChanges,
  functionDeclarationsLocations,
  f
) {
  const isFunctionNotCovered = ([functionKey]: [
    string,
    FunctionNode
  ]): boolean => {
    return f[functionKey] === 0;
  };

  Object.entries(functionDeclarationsLocations)
    .filter(isFunctionNotCovered)
    .forEach(([, node]: [string, FunctionNode]) => {
      const line = node.decl.start.line;
      const column = node.decl.start.column;

      if (
        node.name.startsWith('(anonymous_') &&
        !textChanges.beginsOnStartLine(line, column)
      ) {
        textChanges.insert(createComment('next'), line, column);
      } else {
        textChanges.insertLine(createComment('next'), line);
      }
    });
}
