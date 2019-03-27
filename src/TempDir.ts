import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

export class TempDir {
  private readonly dir: string;

  constructor() {
    this.dir = `/Users/erans/projects/istanbul-ignore-legacy/${new Date().toISOString()}`;
    fs.mkdirSync(this.dir);
    this.setup({
      'package.json': JSON.stringify({
        name: 'test',
        jest: {
          collectCoverage: true
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
      path.join(this.getPath(), fileName); //?
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
