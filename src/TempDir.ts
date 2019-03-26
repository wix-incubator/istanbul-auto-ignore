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
    rimraf.sync(this.getPath());
    this.dir = null;
  }

  public getPath(fileName?: string): string {
    return path.join(...[this.dir.name, fileName].filter(Boolean));
  }

  public setup(files: { [key: string]: string }): void {
    Object.keys(files).forEach(fileName => {
      fs.writeFileSync(
        path.join(this.getPath(), fileName),
        files[fileName],
        "utf8"
      );
    });
  }

  public readFile(fileName: string): string {
    return fs.readFileSync(path.join(this.getPath(), fileName), "utf8");
  }
}
