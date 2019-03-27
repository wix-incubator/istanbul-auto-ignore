/* tslint:disable:no-big-function */
import { TempDir } from "./TempDir";
import { runTool } from "./testHelpers";

describe("Branches", () => {
  let tempDir;
  beforeEach(() => {
    tempDir = new TempDir();
  });
  afterEach(() => {
    tempDir.destroy();
  });

  const callOnlyA = `
            const a = require('./codeFile.js');
            
            
            describe('', () => {
                it('should', () => {
                    a();
                    expect(true).toBe(true)
                });
            });
  
        `;

  describe("if", () => {
    it("when only if is covered", async () => {
      const file = `
            module.exports = function a() {
                if (true) {
                
                }
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
/* istanbul ignore else */
                if (true) {
                
                }
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });

    it("when only else is covered", async () => {
      const file = `
            module.exports = function a() {
                if (false) {
                
                }
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
/* istanbul ignore if */
                if (false) {
                
                }
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });

    it("when is not called", async () => {
      const file = `
            module.exports = function a() {};
            
            function b() {
                if (true) {
                }
            }
            
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {};
            
/* istanbul ignore next */
            function b() {
                if (true) {
                }
            }
            
        `;

      expect(result).toEqual(expectedCodeFile);
    });
  });

  describe("ternary", () => {
    it("when only if is covered", async () => {
      const file = `
            module.exports = function a() {
                return true ? 1 : 0;
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
                return/* istanbul ignore next */ true ? 1 : 0;
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });

    it("when only else is covered", async () => {
      const file = `
            module.exports = function a() {
                return false ? 1 : 0;
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
                return/* istanbul ignore next */ false ? 1 : 0;
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });

    it("when is not called", async () => {
      const file = `
            module.exports = function a() {};
            
            function b() {
                return true ? 1 : 0;
            }
            
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {};
            
/* istanbul ignore next */
            function b() {
                return true ? 1 : 0;
            }
            
        `;

      expect(result).toEqual(expectedCodeFile);
    });
  });
});
