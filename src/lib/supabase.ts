import { createClient } from '@supabase/supabase-js';
import type { Cell, Game, Move, StoredGame } from './types';
import { getBlankGame, getGameCells } from './funcs';
import { DEFAULT_DIFFICULTY, MAX_BOARD_SIZE, MAX_LIVES, MIN_BOARD_SIZE } from './constants';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgREST caps responses at 1000 rows by default, so every full-table read
// has to page through the result. Large boards (and their move history) can
// reach ten thousand rows.
const PAGE_SIZE = 1000;

interface GameHeader {
    id: number;
    sizex: number;
    sizey: number;
    started_at: string;
    ended_at: string | null;
    difficulty: number | null;
    lives_lost: number | null;
}

export async function getGame(): Promise<StoredGame | null> {
    // The latest game is current until `ended_at` is set; finished games stay
    // visible after a reload so the solved board is not lost.
    const { data: header, error: headerError } = await supabase
        .from('games')
        .select('id, sizex, sizey, started_at, ended_at, difficulty, lives_lost')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (headerError) throw headerError;
    if (header == null) return null;

    const game = header as GameHeader;

    // `reset_game` is executable by anon, so a crafted call can still store a
    // size outside the UI's range even though the client clamps before
    // sending. Refuse to allocate a board we were not designed for; the
    // bootstrap path then replaces it with a default game.
    if (
        !Number.isInteger(game.sizex) ||
        !Number.isInteger(game.sizey) ||
        game.sizex < MIN_BOARD_SIZE ||
        game.sizex > MAX_BOARD_SIZE ||
        game.sizey < MIN_BOARD_SIZE ||
        game.sizey > MAX_BOARD_SIZE
    ) {
        console.warn(
            `Ignoring the active game: ${game.sizex}x${game.sizey} is outside ` +
            `${MIN_BOARD_SIZE}-${MAX_BOARD_SIZE}.`
        );
        return null;
    }

    const cells: Cell[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from('board')
            .select('x, y, value')
            .order('x', { ascending: true })
            .order('y', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        cells.push(...(data as Cell[]));
        if (data.length < PAGE_SIZE) break;
    }

    if (cells.length === 0) return null;

    const values = getBlankGame(game.sizex, game.sizey) as boolean[][];

    for (const cell of cells) {
        if (cell.x < 0 || cell.y < 0 || cell.x >= game.sizex || cell.y >= game.sizey) continue;
        values[cell.x][cell.y] = cell.value;
    }

    return {
        id: game.id,
        sizex: game.sizex,
        sizey: game.sizey,
        values,
        ended: game.ended_at != null,
        startedAt: game.started_at,
        endedAt: game.ended_at,
        difficulty: game.difficulty ?? DEFAULT_DIFFICULTY,
        livesLost: Math.max(0, game.lives_lost ?? 0),
    };
}

export async function getMoves(): Promise<Move[]> {
    const moves: Move[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from('movements')
            .select('id, username, x, y, value, auto')
            .order('id', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        moves.push(...(data as Move[]));
        if (data.length < PAGE_SIZE) break;
    }

    return moves;
}

/** Header returned by `reset_game` for the freshly created game. */
interface ResetResult {
    id: number;
    startedAt: string;
    difficulty: number;
    livesLost: number;
}

/**
 * Finalize the current game, replace the global puzzle and refill lives.
 * All of it happens atomically inside the `reset_game` function.
 */
export async function resetGame(game: Game, username: string, difficulty: number): Promise<StoredGame> {
    const { data, error } = await supabase.rpc('reset_game', {
        p_sizex: game.sizex,
        p_sizey: game.sizey,
        p_cells: getGameCells(game),
        p_created_by: username,
        p_max_lives: MAX_LIVES,
        p_difficulty: difficulty,
    });

    if (error) throw error;

    const result = data as ResetResult;

    if (
        result == null ||
        typeof result !== 'object' ||
        typeof result.id !== 'number' ||
        typeof result.startedAt !== 'string'
    ) {
        throw new Error(
            'reset_game returned an unexpected payload. Check that the database function was migrated.'
        );
    }

    return {
        ...game,
        id: result.id,
        ended: false,
        startedAt: result.startedAt,
        endedAt: null,
        difficulty: result.difficulty ?? difficulty,
        livesLost: result.livesLost ?? 0,
    };
}

export interface TurnResult {
    ok: boolean;
    reason?: 'stale_game' | 'unknown_player' | 'no_lives' | 'invalid_cell' | 'taken';
    moves?: Move[];
    lives?: number;
    score?: number;
    ended?: boolean;
    endedAt?: string | null;
    livesLost?: number;
}

export async function playTurn(
    username: string,
    gameId: number,
    x: number,
    y: number,
    intent: boolean
): Promise<TurnResult> {
    const { data, error } = await supabase.rpc('play_turn', {
        p_username: username,
        p_game_id: gameId,
        p_x: x,
        p_y: y,
        p_intent: intent,
    });

    if (error) throw error;
    return data as TurnResult;
}

export async function submitUsername(username: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('players')
        .select('username')
        .eq('username', username);

    if (error) throw error;
    if (data?.length === 1) return true;

    // If not exists make a row. 23505 means another tab created it first.
    const { error: insertError } = await supabase
        .from('players')
        .insert({ username, lives: MAX_LIVES });

    if (insertError && insertError.code !== '23505') throw insertError;

    return false;
}

export async function getUserLives(username: string): Promise<number> {
    const { data, error } = await supabase
        .from('players')
        .select('lives')
        .eq('username', username)
        .maybeSingle();

    if (error) throw error;
    return (data as { lives: number } | null)?.lives ?? MAX_LIVES;
}

// Preparing for usage
export async function getScores() {
    return await supabase.from('players').select("username, won, lose, played, total_score, current_score");
}

export async function getGameDetails() {
    return await supabase
        .from('games')
        .select('id, sizex, sizey, started_at, ended_at, difficulty, lives_lost, created_by, winner')
        .order('id', { ascending: false });
}
