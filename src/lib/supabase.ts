import { createClient } from '@supabase/supabase-js';
import type { Cell, Game, Move, StoredGame } from './types';
import { getBlankGame, getGameCells } from './funcs';
import { MAX_LIVES } from '../ctx/userCtx';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgREST caps responses at 1000 rows by default, so every full-table read
// has to page through the result. A 50x50 board has 2500 cells.
const PAGE_SIZE = 1000;

interface GameHeader {
    id: number;
    sizex: number;
    sizey: number;
    ended_at: string | null;
}

export async function getGame(): Promise<StoredGame | null> {
    // The latest game is current until `ended_at` is set; finished games stay
    // visible after a reload so the solved board is not lost.
    const { data: header, error: headerError } = await supabase
        .from('games')
        .select('id, sizex, sizey, ended_at')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (headerError) throw headerError;
    if (header == null) return null;

    const game = header as GameHeader;
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

/**
 * Finalize the current game, replace the global puzzle and refill lives.
 * All of it happens atomically inside the `reset_game` function.
 */
export async function resetGame(game: Game, username: string): Promise<StoredGame> {
    const { data, error } = await supabase.rpc('reset_game', {
        p_sizex: game.sizex,
        p_sizey: game.sizey,
        p_cells: getGameCells(game),
        p_created_by: username,
        p_max_lives: MAX_LIVES,
    });

    if (error) throw error;

    return { ...game, id: data as number, ended: false };
}

export interface TurnResult {
    ok: boolean;
    reason?: 'stale_game' | 'unknown_player' | 'no_lives' | 'invalid_cell' | 'taken';
    moves?: Move[];
    lives?: number;
    score?: number;
    ended?: boolean;
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
        .select('id, sizex, sizey, started_at, ended_at, created_by, winner')
        .order('id', { ascending: false });
}
