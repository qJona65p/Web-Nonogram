import type { Cell, Clues, ClueRun, Game, Move, SideNums } from "./types";

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

/**
 * Turn the persisted moves into the shared board. Moves are applied in the
 * order they were read (ascending id), so the most recent move wins.
 */
export function boardFromMoves(game: Game, moves: Move[]): (boolean | null)[][] {
    const board = getBlankGame(game.sizex, game.sizey, true) as (boolean | null)[][];

    for (const move of moves) {
        if (move.x < 0 || move.y < 0 || move.x >= game.sizex || move.y >= game.sizey) continue;
        board[move.x][move.y] = move.value;
    }

    return board;
}

export function sameGame(a: Game, b: Game): boolean {
    if (a.sizex !== b.sizex || a.sizey !== b.sizey) return false;

    for (let x = 0; x < a.sizex; x++) {
        for (let y = 0; y < a.sizey; y++) {
            if (a.values[x][y] !== b.values[x][y]) return false;
        }
    }

    return true;
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
 * Merge a freshly loaded board into the current one. Cells already resolved
 * locally are kept so an in-flight move is not lost while a sync is running.
 */
export function mergeBoards(
    current: (boolean | null)[][],
    incoming: (boolean | null)[][]
): (boolean | null)[][] {
    if (
        current.length !== incoming.length ||
        (current[0]?.length ?? 0) !== (incoming[0]?.length ?? 0)
    ) {
        return incoming;
    }

    return incoming.map((column, x) =>
        column.map((value, y) => (value == null ? current[x][y] : value))
    );
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
