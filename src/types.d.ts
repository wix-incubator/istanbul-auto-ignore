interface Point {
  line: number;
  column: number;
}

interface Location {
  start: Point;
  end: Point;
}

export interface Node {
  name: string;
  decl: Location;
  loc: Location;
}

export interface CoverageFinalJSON {
  [key: string]: {
    path: string;
    fnMap: {
      [key: string]: Node;
    };
    f: {
      [key: string]: number;
    };
  };
}
