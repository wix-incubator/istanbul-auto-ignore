import fs from 'fs';
import {
  BranchNode,
  CommentType,
  CoverageFinalJSON,
  FunctionNode
} from './types';
import { TextChanges } from './TextChanges';
import ts from 'typescript';

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
      return {
        textChanges: new TextChanges(fileContent),
        filePath,
        fileContent
      };
    })
    .map(({ textChanges, filePath, fileContent }) => {
      JSON.stringify(coverage[filePath].branchMap[0], null, 2);
      addIgnoreCommentToFunctions(
        textChanges,
        coverage[filePath].fnMap,
        coverage[filePath].f
      );

      addIgnoreCommentToBranches(
        textChanges,
        coverage[filePath].branchMap,
        coverage[filePath].b,
        filePath,
        fileContent
      );
      return { textChanges, filePath };
    })
    .forEach(({ textChanges, filePath }) => {
      fs.writeFileSync(filePath, textChanges.getText(), 'utf8');
    });
}

function getPosition(string: string, subString: string, index: number): number {
  return string.split(subString, index).join(subString).length;
}

function lineAndColToPos(
  fileContent: string,
  line: number,
  col: number
): number {
  return getPosition(fileContent, '\n', line - 1) + col;
}

function findNodePathAtPosition(
  sourceFile: ts.SourceFile,
  position: number
): ts.Node[] {
  let r;
  const forEachChild = parents => (child: ts.Node) => {
    if (r) {
      return;
    }
    try {
      parents.push(child);
      ts.forEachChild(child, forEachChild(parents));
      if (child.getChildCount() === 0 && position <= child.pos) {
        r = parents;
      }
    } catch (e) {
      /**/
    }
  };

  sourceFile.getChildAt(0, sourceFile);
  ts.forEachChild(
    sourceFile,
    forEachChild([sourceFile.getChildAt(0, sourceFile)])
  );
  return r;
}

function addIgnoreCommentToBranches(
  textChanges,
  branchesLocations,
  b,
  filePath,
  fileContent
) {
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
        const sourceFile = ts
          .createProgram([filePath], {
            noResolve: true,
            target: ts.ScriptTarget.Latest,
            experimentalDecorators: true,
            experimentalAsyncFunctions: true,
            //@ts-ignore
            jsx: 'preserve'
          })
          .getSourceFile(filePath);

        if (sourceFile) {
          const { line, column } = node.loc.start;
          const nodePosition = lineAndColToPos(fileContent, line, column);

          const uncoveredNodePath =
            findNodePathAtPosition(sourceFile, nodePosition) || [];
          uncoveredNodePath.reverse();

          const statementNodeKinds = [
            ts.SyntaxKind.ConditionalExpression,
            ts.SyntaxKind.FunctionDeclaration
          ];

          const conditionalExpresionNode = uncoveredNodePath.find(
            statementNode => statementNodeKinds.includes(statementNode.kind)
          );

          /* istanbul ignore else: in the future we won't need this protection */
          if (conditionalExpresionNode) {
            textChanges.insertAtPosition(
              createComment('next'),
              conditionalExpresionNode.pos
            );
          } else {
            textChanges.insert(
              createComment('next'),
              node.loc.start.line,
              node.loc.start.column
            );
          }
        } else {
          textChanges.insert(
            createComment('next'),
            node.loc.start.line,
            node.loc.start.column
          );
        }
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
