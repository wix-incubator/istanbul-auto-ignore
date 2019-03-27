interface Point {
  line: number;
  column: number;
}

interface Location {
  start: Point;
  end: Point;
}

export interface Node {
  decl: Location;
  loc: Location;
}

interface BranchNode extends Node {
  type: string;
}

interface FunctionNode extends Node {
  name: string;
}

export interface CoverageFinalJSON {
  [key: string]: {
    path: string;
    fnMap: {
      [key: string]: FunctionNode;
    };
    branchMap: {
      [key: string]: BranchNode;
    };
    f: {
      [key: string]: number;
    };
    b: {
      [key: string]: number;
    };
  };
}

type CommentType = 'next' | 'if' | 'else';
