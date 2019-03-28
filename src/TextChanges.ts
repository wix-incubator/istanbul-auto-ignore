export class TextChanges {
  private readonly insertedChars: { index: number; str: string }[] = [];
  private readonly textLines: string[];

  constructor(private readonly text: string) {
    this.textLines = this.text.split('\n');
  }

  public insert(str: string, line: number, column: number): void {
    this.insertedChars.push({ str, index: this.getIndex(line, column) });
  }

  public insertAtPosition(str: string, pos: number): void {
    this.insertedChars.push({ str, index: pos });
  }

  public insertLine(str: string, line: number): void {
    this.insert(`${str}\n`, line, 1);
  }

  public getText(): string {
    this.insertedChars.sort((a, b) => a.index - b.index);
    let insertedChars = 0;
    let changedText = this.text;
    this.insertedChars.forEach(({ index, str }) => {
      const newIndex = index + insertedChars;
      changedText =
        changedText.slice(0, newIndex) +
        str +
        changedText.slice(newIndex, changedText.length);
      insertedChars += str.length;
    });
    return changedText;
  }

  private getIndex(line, column): number {
    const textLinesCount = this.textLines.length;
    const charsInLines = this.textLines
      .map((l, index) => l.length + (index === textLinesCount - 1 ? 0 : 1))
      .slice(0, line - 1)
      .reduce((sum, length) => sum + length, 0);

    return charsInLines + (column - 1);
  }

  public beginsOnStartLine(line: number, column: number): boolean {
    const textBefore = this.textLines[line - 1].substring(0, column);
    return /^\s*$/.test(textBefore);
  }
}
