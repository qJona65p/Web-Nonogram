import type { Cell, Clues, ClueRun, Game, Move, SideNums, StoredGame } from "./types";

export function generateGame(sizex: number, sizey: number, difficulty: number): Game {
    if (difficulty > 0.8) difficulty = 0.8;
    if (difficulty < 0.3) difficulty = 0.3;

    // Crear un array de X filas por Y columnas lleno de ceros
    const game: boolean[][] = Array.from({ length: sizex }, () =>
        Array(sizey).fill(false)
    );

    for (let x = 0; x < sizex; x++) {
        for (let y = 0; y < sizey; y++) {
            game[x][y] = Math.random() > difficulty;
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
    let next = board;

    for (const move of moves) {
        const column = next[move.x];
        if (column == null || move.y < 0 || move.y >= column.length) continue;
        if (column[move.y] != null) continue;

        next = setCell(next, move.x, move.y, move.value);
    }

    return next;
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

export function setCell(
    board: (boolean | null)[][],
    x: number,
    y: number,
    value: boolean
): (boolean | null)[][] {
    const next = board.map((column) => column.slice());
    next[x][y] = value;
    return next;
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

export function colorFor(username: string): string {
    let hash = 0;

    for (let i = 0; i < username.length; i++) {
        hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
    }

    return `hsl(${hash % 360} 70% 55%)`;
}
