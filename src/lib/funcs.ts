import type { Cell, Clues, ClueRun, Game, Move, SideNums, StoredGame } from "./types";
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "./constants";

// `generateGame`'s third argument is the chance that a cell stays blank, so a
// higher value means a sparser (harder) puzzle. Keep the extremes away from 0
// and 1 so we never generate a fully filled or empty board.
const MIN_BLANK_CHANCE = 0.3;
const MAX_BLANK_CHANCE = 0.8;

export function generateGame(sizex: number, sizey: number, difficulty: number): Game {
    const requested = Number.isFinite(difficulty) ? difficulty : 0.5;
    const blankChance = Math.min(MAX_BLANK_CHANCE, Math.max(MIN_BLANK_CHANCE, requested));

    // Crear un array de X filas por Y columnas lleno de ceros
    const game: boolean[][] = Array.from({ length: sizex }, () =>
        Array(sizey).fill(false)
    );

    for (let x = 0; x < sizex; x++) {
        for (let y = 0; y < sizey; y++) {
            game[x][y] = Math.random() > blankChance;
        }
    }

    return { sizex, sizey, values: game };
}

export function getBlankGame(sizex: number, sizey: number, nulls: boolean = false) {
    return Array.from({ length: sizex }, () => Array(sizey).fill(nulls ? null : false));
}

export function getGameCells(game: Game): Cell[] {
    const cells: Cell[] = [];

    for (let x = 0; x < game.sizex; x++) {
        for (let y = 0; y < game.sizey; y++) {
            cells.push({ x, y, value: game.values[x][y]! });
        }
    }

    return cells;
}

export function applyMoves(
    board: (boolean | null)[][],
    moves: Move[]
): (boolean | null)[][] {
    // A completed line can auto-fill many cells at once, so copy each touched
    // row once per batch instead of copying the whole board once per move.
    // Untouched rows keep their identity, which lets the board skip
    // re-rendering them on large puzzles.
    let next: (boolean | null)[][] | null = null;

    for (const move of moves) {
        const rows = next ?? board;
        const row = rows[move.x];
        if (row == null || move.y < 0 || move.y >= row.length) continue;
        if (row[move.y] != null) continue;

        if (next == null) next = board.slice();
        if (next[move.x] === board[move.x]) next[move.x] = board[move.x].slice();

        next[move.x][move.y] = move.value;
    }

    return next ?? board;
}

export function isSolved(game: Game, board: (boolean | null)[][]): boolean {
    for (let x = 0; x < game.sizex; x++) {
        for (let y = 0; y < game.sizey; y++) {
            if (game.values[x][y] === true && board[x][y] !== true) return false;
        }
    }

    return true;
}

export function sameGame(a: StoredGame, b: StoredGame): boolean {
    return a.id === b.id;
}

/**
 * Compute the clue runs for every row and column, keeping the cells each run
 * belongs to so progress can be derived from the board instead of mutated.
 */
export function computeClues(game: Game): Clues {
    const rows: ClueRun[][] = [];

    for (let x = 0; x < game.sizex; x++) {
        const runs: ClueRun[] = [];
        let run: ClueRun | null = null;

        for (let y = 0; y < game.sizey; y++) {
            if (game.values[x][y]) {
                if (run == null) {
                    run = { count: 0, cells: [] };
                    runs.push(run);
                }
                run.count++;
                run.cells.push([x, y]);
            } else {
                run = null;
            }
        }

        rows.push(runs);
    }

    const cols: ClueRun[][] = [];

    for (let y = 0; y < game.sizey; y++) {
        const runs: ClueRun[] = [];
        let run: ClueRun | null = null;

        for (let x = 0; x < game.sizex; x++) {
            if (game.values[x][y]) {
                if (run == null) {
                    run = { count: 0, cells: [] };
                    runs.push(run);
                }
                run.count++;
                run.cells.push([x, y]);
            } else {
                run = null;
            }
        }

        cols.push(runs);
    }

    return { rows, cols };
}

function remainingInRun(run: ClueRun, board: (boolean | null)[][]): number {
    let remaining = run.count;

    for (const [x, y] of run.cells) {
        if (board[x]?.[y] === true) remaining--;
    }

    return Math.max(remaining, 0);
}

/**
 * Clues keep the same `[count, remaining]` shape the number gutters already
 * render, but remaining is recomputed from the board on every change.
 */
export function progressSidenums(clues: Clues, board: (boolean | null)[][]): SideNums {
    return {
        Right: clues.rows.map((runs) => runs.map((run) => [run.count, remainingInRun(run, board)])),
        Up: clues.cols.map((runs) => runs.map((run) => [run.count, remainingInRun(run, board)])),
    };
}

/** Clamp a value to an inclusive range. NaN falls back to `min`. */
export function clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
}

/**
 * Map the slider value onto the generator's 0-1 input, where higher means a
 * sparser board. `generateGame` then clamps that input to its supported
 * blank-chance window, so changing `MIN_DIFFICULTY` / `MAX_DIFFICULTY` keeps
 * the mapping relative instead of relying on a hard-coded divisor.
 */
export function normalizeDifficulty(difficulty: number): number {
    const span = MAX_DIFFICULTY - MIN_DIFFICULTY;
    if (span <= 0) return 0.5;

    const value = Number.isFinite(difficulty) ? difficulty : MIN_DIFFICULTY;
    return (value - MIN_DIFFICULTY) / span;
}

/** Human label for the difficulty slider value, scaled to its range. */
export function difficultyLabel(difficulty: number): string {
    const ratio = normalizeDifficulty(difficulty);

    if (ratio <= 0.3) return "Easy";
    if (ratio <= 0.5) return "Medium";
    if (ratio <= 0.7) return "Hard";
    return "Expert";
}

export function colorFor(username: string): string {
    let hash = 0;

    for (let i = 0; i < username.length; i++) {
        hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
    }

    return `hsl(${hash % 360} 70% 55%)`;
}
