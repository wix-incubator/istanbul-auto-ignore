interface Point {
  line: number;
  column: number;
}

interface Location {
  start: Point;
  end: Point;
}

export interface CoverageFinalJSON {
  [key: string]: {
    path: string;
    fnMap: {
      [key: string]: {
        name: string;
        decl: Location;
        loc: Location;
      };
    };
    f: {
      [key: string]: number;
    };
  };
}
