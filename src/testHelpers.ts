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

  await runCLI(
    {
      silent: true,
      cache: false,
      outputFile: '1.txt'
    } as Config.Argv,
    [tempDir.getPath()]
  );

  run(tempDir.getPath('coverage/coverage-final.json'));
  return tempDir.readFile(`codeFile.${extention}`);
}
