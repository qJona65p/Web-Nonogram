'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Game, SideNums } from '../lib/types';
import { getGame, setGameDB } from '../lib/supabase';
import { useAuth } from './userCtx';
import { generateGame, numberCount } from '../lib/funcs';

interface GameCtxProps {
    sizex: number | null;
    sizey: number | null;
    game: Game | null;
    onGenerateGame: (sizex: number, sizey: number, difficulty: number) => void;
    gameChanged: boolean;
    sidenums: SideNums | null;
}

const GameContext = createContext<GameCtxProps | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const { username, resetLives } = useAuth();

    const [game, setGame] = useState<Game | null >(null);
    const [sidenums, setSidenums] = useState<SideNums | null>(null);
    const [gameChanged, setGameChanged] = useState(false);

    // Load username from localStorage on initial mount
    useEffect(() => {
        getGame()
            .then((res) => {
                setGame(res);
            });
    }, [gameChanged])

    useEffect(() => {
        if (game != null && username != null) {
            setSidenums(numberCount(game));
        }
    }, [game])

    const onGenerateGame = (newsizex: number, newsizey: number, newdifficulty: number) => {
        setGame(null);
        setGameDB(generateGame(newsizex, newsizey, newdifficulty / 10))
            .then(() => { 
                setGameChanged((c) => !c);
                resetLives();
            })
    }

    return (
        <GameContext.Provider value={{ sizex: game ? game.sizex : null, sizey: game ? game.sizey : null, game, onGenerateGame, gameChanged, sidenums }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within an GameProvider');
    }
    return context;
}