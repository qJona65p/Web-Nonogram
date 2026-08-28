import { createClient } from '@supabase/supabase-js';
import type { Cell, Game } from './types';
import { getBlankGame } from './funcs';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function setGameDB(game: Game) {
    var translated: Cell[] = [];

    for (let x = 0; x < game.sizex; x++) {
        for (let y = 0; y < game.sizey; y++) {
            translated.push({ x, y, value: game.values[x][y]!})
        }
    }

    await supabase.rpc('truncate_game');

    return await supabase.from('game').insert(translated);
}

export async function getGame(): Promise<Game> {
    const res = (await supabase.from('game').select()).data as Cell[];

    const sizex = res[res.length - 1].x + 1;
    const sizey = res[res.length - 1].y + 1;

    let game = getBlankGame(sizex, sizey);

    for (let c = 0; c < res.length; c++) {
        game[res[c].x][res[c].y] = res[c].value;
    }

    return { sizex, sizey, values: game}
}

export async function getCellDB(x: number, y: number): Promise<boolean> {
    return await supabase.from('game').select('value')
        .match({x, y}).single()
        .then((res) => res.data?.value);
}

export async function setMovement(username: string, x: number, y: number, value: boolean) {
    await supabase.from('movements').insert({ username, x, y, value });
}

export async function submitUsername(username: string): Promise<boolean> {
    var exists = await supabase.from('players').select('username').eq('username', username);
    if (exists.data?.length == 1) return true;

    // If not exists make a row
    await supabase.from('players').insert({ username });

    return false;
}

export async function getScores() {
    return await supabase.from('players').select("username, won, lose, score");
}