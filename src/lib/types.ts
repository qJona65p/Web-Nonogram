export interface Game {
    sizex: number;
    sizey: number;
    values: (boolean | null)[][];
}

export interface Cell {
    x: number;
    y: number;
    value: boolean;
}

export interface SideNums {
    Right: number[][];
    Up: number[][];
}