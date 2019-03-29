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
      ts.forEachChild(child, forEachChild([...parents, child]));
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
      if (
        node.type === 'cond-expr' ||
        node.type === 'if' ||
        node.type === 'binary-expr' ||
        node.type === 'default-arg'
      ) {
        const sourceFile = ts
          .createProgram([filePath], {
            noResolve: true,
            allowJs: true,
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

          if (
            node.type !== 'binary-expr' &&
            uncoveredNodePath[0].kind === ts.SyntaxKind.BinaryExpression
          ) {
            uncoveredNodePath.shift();
          }

          const statementNodeKinds = [
            ts.SyntaxKind.ConditionalExpression,
            ts.SyntaxKind.FunctionDeclaration,
            ts.SyntaxKind.VariableStatement,
            ts.SyntaxKind.ReturnStatement,
            ts.SyntaxKind.IfStatement,
            ts.SyntaxKind.BinaryExpression,
            ts.SyntaxKind.MethodDeclaration,
            ts.SyntaxKind.Constructor
          ];

          let conditionalExpresionNode = uncoveredNodePath.find(statementNode =>
            statementNodeKinds.includes(statementNode.kind)
          );

          if (
            conditionalExpresionNode &&
            conditionalExpresionNode.kind === ts.SyntaxKind.BinaryExpression &&
            uncoveredBranchType === 'else' &&
            (conditionalExpresionNode as ts.BinaryExpression).operatorToken
              .kind === ts.SyntaxKind.BarBarToken
          ) {
            conditionalExpresionNode = (conditionalExpresionNode as ts.BinaryExpression)
              .right;
          }

          let comment = createComment('next');

          /* istanbul ignore else: in the future we won't need this protection */
          if (conditionalExpresionNode) {
            let notSpaceIndex = conditionalExpresionNode.pos;
            while (/\s/.test(fileContent[notSpaceIndex])) {
              notSpaceIndex++;
            }

            if (conditionalExpresionNode.kind === ts.SyntaxKind.IfStatement) {
              comment = createComment(uncoveredBranchType);
            }

            textChanges.insertAtPosition(comment, notSpaceIndex);
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
