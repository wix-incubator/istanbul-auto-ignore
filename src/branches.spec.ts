/* tslint:disable:no-big-function */
import { TempDir } from './TempDir';
import { runTool } from './testHelpers';

describe('Branches', () => {
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

  describe('if', () => {
    it('when only if is covered', async () => {
      const file = `
            module.exports = function a() {
                if (true) {
                
                }
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
                /* istanbul ignore else */if (true) {
                
                }
            };
        `;
      expect(result).toEqual(expectedCodeFile);
    });

    it('when only else is covered', async () => {
      const file = `
            module.exports = function a() {
                if (false) {
                
                }
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
                /* istanbul ignore if */if (false) {
                
                }
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - when is not called', async () => {
      const file = `
            export default function a() {};
            
            export function b() {
                if (true) {
                }
            }
            
        `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => {
      it('', () => {A()})
      })`,
        true
      );
      const expectedCodeFile = `
            export default function a() {};
            
/* istanbul ignore next */
            export function b() {
                if (true) {
                }
            }
            
        `;

      expect(result).toEqual(expectedCodeFile);
    });
  });

  describe('ternary', () => {
    it('when only if is covered', async () => {
      const file = `
            module.exports = function a() {
                return true ? 1 : 0;
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
                return /* istanbul ignore next */true ? 1 : 0;
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('when only else is covered', async () => {
      const file = `
            module.exports = function a() {
                return false ? 1 : 0;
            };
        `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
            module.exports = function a() {
                return /* istanbul ignore next */false ? 1 : 0;
            };
        `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('when is not called', async () => {
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

  describe('Typescript', () => {
    it('TS - when ternary if', async () => {
      const file = `
      export default function a() {
            return         true    ? 343241 : 4324324322
            };
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true
      );
      const expectedCodeFile = `
      export default function a() {
            return         /* istanbul ignore next */true    ? 343241 : 4324324322
            };
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - when ternary if with tsx', async () => {
      const file = `
import * as React from 'react';
      export default function a() {
            const myA = new A();
            myA.render();
            };
            
      class A {         
            public render() {
            return true ? null : <div></div>;
      }
  }
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
import * as React from 'react';
      export default function a() {
            const myA = new A();
            myA.render();
            };
            
      class A {         
            public render() {
            return /* istanbul ignore next */true ? null : <div></div>;
      }
  }
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - when ternary if with function call inside', async () => {
      const file = `
import * as React from 'react';
      export default function a() {
            const myA = new A();
            myA.render();
            };
            
      class A {         
            public render() {
            return true ? console.log() : <div></div>;
      }
  }
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
import * as React from 'react';
      export default function a() {
            const myA = new A();
            myA.render();
            };
            
      class A {         
            public render() {
            return /* istanbul ignore next */true ? console.log() : <div></div>;
      }
  }
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - when ternary if with function call inside', async () => {
      const file = `
      export default () => 
      console.log(console.log(console.log(1)), true ? {} : {})`;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
      export default () => 
      console.log(console.log(console.log(1)), /* istanbul ignore next */true ? {} : {})`;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - when ternary if with binary expression inside', async () => {
      const file = `
      export default () => 
        true ? 1 + 2 : undefined;`;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
      export default () => 
        /* istanbul ignore next */true ? 1 + 2 : undefined;`;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - when ternary if with binary expression inside const', async () => {
      const file = `
      export default () => {
        const c = true ? 1 + 2 : undefined;
      }
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
      export default () => {
        /* istanbul ignore next */const c = true ? 1 + 2 : undefined;
      }
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - default inside variable', async () => {
      const file = `
        export default () => {
          b();
        };
        
        function b() {
          1;const {a = ''} = {};
        }
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
        export default () => {
          b();
        };
        
        function b() {
          1;/* istanbul ignore next */const {a = ''} = {};
        }
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('default arg', async () => {
      const file = `
        export default function a({
          cssPath
        }: {cssPath?: string[]} = {}) {}
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
        /* istanbul ignore next */export default function a({
          cssPath
        }: {cssPath?: string[]} = {}) {}
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('default assignments', async () => {
      const file = `
        export default function a() {
         const a = true || 1;}
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
        export default function a() {
         const a = true || /* istanbul ignore next */1;}
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('default value for function argument', async () => {
      const file = `
        export default function a() {
          function b(c:string, b:string='') {
          }
          b('c','s');
        }
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
        export default function a() {
          /* istanbul ignore next */function b(c:string, b:string='') {
          }
          b('c','s');
        }
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('default value for class method argument', async () => {
      const file = `
      export class C{
            public b(c:string, b:string=''): void {
            console.log()
            }
          }
        export default function a() {
          
          new C().b('c','s');
        }
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true,
        true
      );
      const expectedCodeFile = `
      export class C{
            /* istanbul ignore next */public b(c:string, b:string=''): void {
            console.log()
            }
          }
        export default function a() {
          
          new C().b('c','s');
        }
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('default value for object inside class method argument', async () => {
      const file = `
        class C{
             constructor(i = {p: ''}) {
              console.log()
            }
          }
        module.exports = function a() {new C(9)}
      `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
        class C{
             /* istanbul ignore next */constructor(i = {p: ''}) {
              console.log()
            }
          }
        module.exports = function a() {new C(9)}
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('TS - default value for object inside class method argument', async () => {
      const file = `
        class C{
             constructor(i = {p: ''}) {
              console.log()
            }
          }
        export default function a() {new C({p:''})}
      `;

      const result = await runTool(
        tempDir,
        file,
        `import A from './codeFile'; describe('', () => { it('', () => {A()}) })`,
        true
      );
      const expectedCodeFile = `
        class C{
             /* istanbul ignore next */constructor(i = {p: ''}) {
              console.log()
            }
          }
        export default function a() {new C({p:''})}
      `;

      expect(result).toEqual(expectedCodeFile);
    });

    it('else if', async () => {
      const file = `
        module.exports = function a() {
          if(true){
            if(false) {
            } else if (true) {  
            } else {
            }
          }
        }
      `;

      const result = await runTool(tempDir, file, callOnlyA);
      const expectedCodeFile = `
        module.exports = function a() {
          /* istanbul ignore else */if(true){
            /* istanbul ignore if */if(false) {
            } else /* istanbul ignore next */if (true) {  
            } else {
            }
          }
        }
      `;

      expect(result).toEqual(expectedCodeFile);
    });
  });
});
