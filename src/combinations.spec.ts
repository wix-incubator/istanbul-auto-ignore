/* tslint:disable:no-big-function */
import { TempDir } from './TempDir';
import { runTool } from './testHelpers';

describe('Combinations', () => {
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

  describe('Branches and Functions', () => {
    it('when only if is covered', async () => {
      const file = `
            module.exports = function a() {
                function b() {

                }
                if (true) {
                
                }
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
/* istanbul ignore next */
                function b() {

                }
                /* istanbul ignore else */if (true) {
                
                }
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });
  });
});
