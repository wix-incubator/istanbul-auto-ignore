import fs from "fs";
import path from "path";
import tmp from "tmp";
import rimraf from "rimraf";

export class TempDir {
  private dir: { name: string; removeCallback: Function };

  constructor() {
    this.dir = tmp.dirSync();
    this.setup({
      "package.json": JSON.stringify({
        name: "test",
        jest: {
          collectCoverage: true
        }
      })
    });
  }

  public destroy(): void {
    this.checkDir();
    rimraf.sync(this.getPath());
    this.dir = null;
  }

  public getPath(fileName?: string): string {
    this.checkDir();
    return path.join(...[this.dir.name, fileName].filter(Boolean));
  }

  public setup(files: { [key: string]: string }): void {
    this.checkDir();
    Object.keys(files).forEach(fileName => {
      fs.writeFileSync(
        path.join(this.getPath(), fileName),
        files[fileName],
        "utf8"
      );
    });
  }

  public read(files: string[]): { [key: string]: string } {
    this.checkDir();
    return Object.assign(
      {},
      ...files.map(fileName => ({
        [fileName]: fs.readFileSync(path.join(this.getPath(), fileName), "utf8")
      }))
    );
  }

  public readFile(fileName: string): string {
    this.checkDir();
    return fs.readFileSync(path.join(this.getPath(), fileName), "utf8");
  }

  private checkDir() {
    if (this.dir === null) {
      throw new Error("The dir is destroyed");
    }
  }
}
