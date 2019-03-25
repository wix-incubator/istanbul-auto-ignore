import { runCLI } from "@jest/core";
import { Config } from "@jest/types";
import { TempDir } from "./TempDir";

describe("", () => {
  let tempDir;
  beforeEach(() => {
    tempDir = new TempDir();
  });
  afterEach(() => {
    tempDir.destroy();
  });

  it("should pass", async () => {
    const file = `
            module.exports = function a() {
                console.log(2);
                if (false) {
                    console.log(1);
            
                }
            };
        `;

    const testFile = `
            const a = require('./codeFile.js');
            
            
            describe('', () => {
                it('should', () => {
                    a();
                    expect(true).toBe(true)
                });
            });
  
        `;

    tempDir.setup({
      "codeFile.js": file,
      "codeFile.spec.js": testFile
    });

    const { results } = await runCLI(
      {
        collectCoverage: true,
        silent: true,
        outputFile: "1.txt"
      } as Config.Argv,
      [tempDir.getPath()]
    );
    expect(Object.keys(results.coverageMap.data)[0]).toContain("codeFile.js");
  });
});
