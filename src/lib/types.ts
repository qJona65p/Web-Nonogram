export interface Game {
    sizex: number;
    sizey: number;
    values: (boolean | null)[][];
}

export interface StoredGame extends Game {
    id: number;
    ended: boolean;
    /** ISO timestamp written by `reset_game`. */
    startedAt: string;
    /** ISO timestamp written by `end_game`, or null while in progress. */
    endedAt: string | null;
    /** Requested difficulty slider value. Labels are derived on the client. */
    difficulty: number;
    /** Lives lost by every player in this game, reset with the game. */
    livesLost: number;
}

/** Live stats carried alongside a realtime `moves` broadcast. */
export interface GameStats {
    gameId?: number;
    livesLost?: number;
    ended?: boolean;
    endedAt?: string | null;
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
