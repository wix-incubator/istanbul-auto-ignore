import { runCLI } from "@jest/core";
import { Config } from "@jest/types";
import { TempDir } from "./TempDir";
import { run } from "./index";

export async function runTool(
  tempDir: TempDir,
  codeFile: string,
  testFile: string
): Promise<string> {
  tempDir.setup({
    "codeFile.js": codeFile,
    "codeFile.spec.js": testFile
  });

  await runCLI(
    {
      collectCoverage: true,
      silent: true,
      outputFile: "1.txt"
    } as Config.Argv,
    [tempDir.getPath()]
  );

  run(tempDir.getPath("coverage/coverage-final.json"));

  return tempDir.readFile("codeFile.js");
}
