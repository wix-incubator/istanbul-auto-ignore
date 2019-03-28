import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import uuid from 'uuid/v4';

export class TempDir {
  private readonly dir: string;

  constructor() {
    const tmpDest = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDest)) {
      fs.mkdirSync(tmpDest);
    }

    this.dir = path.join(tmpDest, uuid());
    fs.mkdirSync(this.dir);
    this.setup({
      'package.json': JSON.stringify({
        name: 'temp-package',
        jest: {
          collectCoverage: true,
          transform: {
            '\\.(ts|tsx)$': 'ts-jest'
          },
          testRegex: '\\.spec\\.(tsx?|jsx?)$',
          moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
        }
      }),
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          jsx: 'react'
        }
      })
    });
  }

  public destroy(): void {
    rimraf.sync(this.getPath());
  }

  public getPath(fileName?: string): string {
    return path.join(...[this.dir, fileName].filter(Boolean));
  }

  public setup(files: { [key: string]: string }): void {
    Object.keys(files).forEach(fileName => {
      path.join(this.getPath(), fileName);
      fs.writeFileSync(
        path.join(this.getPath(), fileName),
        files[fileName],
        'utf8'
      );
    });
  }

  public readFile(fileName: string): string {
    return fs.readFileSync(path.join(this.getPath(), fileName), 'utf8');
  }
}
