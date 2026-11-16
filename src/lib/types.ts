export interface Game {
    sizex: number;
    sizey: number;
    values: (boolean | null)[][];
}

export interface StoredGame extends Game {
    id: number;
    ended: boolean;
}

export interface Cell {
    x: number;
    y: number;
    value: boolean;
}

export interface Move {
    id?: number;
    x: number;
    y: number;
    value: boolean;
    username: string;
    /** true when the cell was filled automatically by a completed line */
    auto?: boolean;
}

export interface OnlinePlayer {
    username: string;
    color: string;
}

export type ConnectionStatus = 'connecting' | 'live' | 'offline';

export interface ClueRun {
    count: number;
    cells: [number, number][];
}

export interface Clues {
    rows: ClueRun[][];
    cols: ClueRun[][];
}

export interface SideNums {
    Right: number[][][];
    Up: number[][][];
}
