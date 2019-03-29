import { runCLI } from '@jest/core';
import { Config } from '@jest/types';
import { TempDir } from './TempDir';
import { run } from './index';

export async function runTool(
  tempDir: TempDir,
  codeFile: string,
  testFile: string,
  ts = false,
  tsx = false
): Promise<string> {
  const extention = ts ? (tsx ? 'tsx' : 'ts') : 'js';
  tempDir.setup({
    [`codeFile.${extention}`]: codeFile,
    [`codeFile.spec.${extention}`]: testFile
  });

  await runCLI({ cache: false } as Config.Argv, [tempDir.getPath()]);

  run(tempDir.getPath('coverage/coverage-final.json'));

  const resultsAfterTool = await runCLI(
    {
      cache: false,
      coverageThreshold: '100',
      collectCoverage: true
    } as Config.Argv,
    [tempDir.getPath()]
  );
  const coverageResults = resultsAfterTool.results.coverageMap.getCoverageSummary();
  if (coverageResults.branches.pct !== 100) {
    throw new Error('branches are not 100% covered');
  }
  if (coverageResults.functions.pct !== 100) {
    throw new Error('functions are not 100% covered');
  }
  if (coverageResults.statements.pct !== 100) {
    throw new Error('statements are not 100% covered');
  }
  if (coverageResults.lines.pct !== 100) {
    throw new Error('lines are not 100% covered');
  }

  return tempDir.readFile(`codeFile.${extention}`);
}
