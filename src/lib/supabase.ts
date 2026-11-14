import { createClient } from '@supabase/supabase-js';
import type { Cell, Game, Move } from './types';
import { getBlankGame, getGameCells } from './funcs';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgREST caps responses at 1000 rows by default, so every full-table read
// has to page through the result. A 50x50 board has 2500 cells.
const PAGE_SIZE = 1000;

export async function getGame(): Promise<Game | null> {
    const cells: Cell[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from('game')
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

    const sizex = Math.max(...cells.map((cell) => cell.x)) + 1;
    const sizey = Math.max(...cells.map((cell) => cell.y)) + 1;
    const values = getBlankGame(sizex, sizey) as boolean[][];

    for (const cell of cells) values[cell.x][cell.y] = cell.value;

    return { sizex, sizey, values };
}

export async function getMoves(): Promise<Move[]> {
    const moves: Move[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
            .from('movements')
            .select('id, username, x, y, value')
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
 * Replace the global puzzle and clear the shared board. Player rows are kept
 * so usernames/lives/scores continue to work.
 */
export async function resetGame(game: Game) {
    const { error: gameDeleteError } = await supabase
        .from('game')
        .delete()
        .gte('x', 0);

    if (gameDeleteError) throw gameDeleteError;

    const { error: gameInsertError } = await supabase.from('game').insert(getGameCells(game));

    if (gameInsertError) throw gameInsertError;

    const { error: movesDeleteError } = await supabase
        .from('movements')
        .delete()
        .gte('id', 0);

    if (movesDeleteError) throw movesDeleteError;
}

export async function setMovement(username: string, x: number, y: number, value: boolean) {
    const insert = () => supabase.from('movements').insert({ username, x, y, value });

    let { error } = await insert();

    // 23503 = the player row is missing (stale localStorage session). Create it
    // and try the move once more so the move is not lost for late joiners.
    if (error?.code === '23503') {
        await submitUsername(username).catch(() => undefined);
        ({ error } = await insert());
    }

    if (error) console.error('Could not save move', error);
}

export async function submitUsername(username: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('players')
        .select('username')
        .eq('username', username);

    if (error) throw error;
    if (data?.length === 1) return true;

    // If not exists make a row. 23505 means another tab created it first.
    const { error: insertError } = await supabase.from('players').insert({ username });

    if (insertError && insertError.code !== '23505') throw insertError;

    return false;
}

export async function getScores() {
    return await supabase.from('players').select("username, won, lose, score");
}
