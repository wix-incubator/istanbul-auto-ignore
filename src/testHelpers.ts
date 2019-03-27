import { runCLI } from '@jest/core';
import { Config } from '@jest/types';
import { TempDir } from './TempDir';
import { run } from './index';

export async function runTool(
  tempDir: TempDir,
  codeFile: string,
  testFile: string,
  ts = false
): Promise<string> {
  const extention = ts ? 'ts' : 'js';
  tempDir.setup({
    [`codeFile.${extention}`]: codeFile,
    [`codeFile.spec.${extention}`]: testFile,
    'package.json': JSON.stringify({
      name: 'temp-package',
      jest: {
        collectCoverage: true,
        transform: {
          '^.+\\.ts$': 'ts-jest'
        }
      }
    })
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
