'use client';

/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ConnectionStatus, Game, Move, OnlinePlayer, SideNums } from '../lib/types';
import { getGame, getMoves, resetGame, setMovement } from '../lib/supabase';
import { useAuth } from './userCtx';
import {
    boardFromMoves,
    computeClues,
    generateGame,
    getBlankGame,
    mergeBoards,
    progressSidenums,
    sameGame,
    setCell,
} from '../lib/funcs';
import { subscribeToGame, type GameChannel } from '../lib/realtime';

interface GameCtxProps {
    sizex: number | null;
    sizey: number | null;
    game: Game | null;
    board: (boolean | null)[][] | null;
    onGenerateGame: (sizex: number, sizey: number, difficulty: number) => Promise<void>;
    playCell: (x: number, y: number, intent: boolean) => void;
    sidenums: SideNums | null;
    connection: ConnectionStatus;
    onlinePlayers: OnlinePlayer[];
}

const GameContext = createContext<GameCtxProps | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const { username, lives, loseLive, resetLives } = useAuth();

    const [game, setGame] = useState<Game | null>(null);
    const [board, setBoard] = useState<(boolean | null)[][] | null>(null);
    const [connection, setConnection] = useState<ConnectionStatus>('connecting');
    const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);

    const channelRef = useRef<GameChannel | null>(null);
    const latest = useRef({ game, board, username, lives, loseLive });

    // Keep the click handler stable (so board cells can be memoized) while
    // still reading the freshest state.
    useEffect(() => {
        latest.current = { game, board, username, lives, loseLive };
    }, [game, board, username, lives, loseLive]);

    // Initial load. If the database has no puzzle yet, create a default one so
    // the first player does not land on a crash.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                let current = await getGame();

                if (current == null) {
                    current = generateGame(10, 10, 0.5);
                    await resetGame(current);
                }

                const moves = await getMoves();
                if (cancelled) return;

                setGame(current);
                setBoard(boardFromMoves(current, moves));
            } catch (error) {
                console.error('Could not load the game', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const syncBoard = useCallback(async (mode: 'replace' | 'merge') => {
        const current = await getGame();
        if (current == null) return;

        const moves = await getMoves();

        // Only merge when the puzzle itself is unchanged. If someone generated
        // a new puzzle while we were offline, replace the board even when the
        // dimensions happen to match.
        const previous = latest.current.game;
        const canMerge = mode === 'merge' && previous != null && sameGame(previous, current);

        setGame(current);
        setBoard((prev) => {
            const fresh = boardFromMoves(current, moves);
            return canMerge && prev != null ? mergeBoards(prev, fresh) : fresh;
        });
    }, []);

    const applyRemoteMove = useCallback((move: Move) => {
        setBoard((prev) => {
            if (prev == null || move == null) return prev;

            const { x, y, value } = move;
            if (typeof x !== 'number' || typeof y !== 'number' || typeof value !== 'boolean') {
                return prev;
            }
            if (prev[x]?.[y] != null) return prev;

            return setCell(prev, x, y, value);
        });
    }, []);

    // One channel per logged-in user. Presence and broadcast make the board
    // collaborative; the database keeps it durable for late joiners.
    useEffect(() => {
        if (username == null) return;

        const channel = subscribeToGame(username, {
            onMove: applyRemoteMove,
            onPresence: setOnlinePlayers,
            onStatus: setConnection,
            onSubscribed: () => {
                void syncBoard('merge').catch((error) =>
                    console.error('Could not sync the board', error)
                );
            },
            onReset: () => {
                void syncBoard('replace').catch((error) =>
                    console.error('Could not sync the board', error)
                );
                resetLives();
            },
        });

        channelRef.current = channel;

        return () => {
            channelRef.current = null;
            channel.unsubscribe();
        };
    }, [username, applyRemoteMove, syncBoard, resetLives]);

    const playCell = useCallback((x: number, y: number, intent: boolean) => {
        const current = latest.current;

        if (current.game == null || current.board == null || current.username == null) return;
        if (current.lives <= 0) return;
        if (x < 0 || y < 0 || x >= current.game.sizex || y >= current.game.sizey) return;
        if (current.board[x]?.[y] != null) return;

        const truth = current.game.values[x][y];
        if (truth == null) return;

        // Reveal locally right away, then share and persist the move.
        setBoard((prev) => {
            if (prev == null || prev[x]?.[y] != null) return prev;
            return setCell(prev, x, y, truth);
        });

        if (truth !== intent) current.loseLive();

        const move: Move = { x, y, value: truth, username: current.username };
        channelRef.current?.sendMove(move);
        void setMovement(current.username, x, y, truth);
    }, []);

    const onGenerateGame = useCallback(async (sizex: number, sizey: number, difficulty: number) => {
        const next = generateGame(sizex, sizey, difficulty / 10);

        try {
            await resetGame(next);

            setGame(next);
            setBoard(getBlankGame(sizex, sizey, true));
            resetLives();
            channelRef.current?.announceReset();
        } catch (error) {
            console.error('Could not generate a new game', error);
        }
    }, [resetLives]);

    // Clue progress is derived from the board, so remote moves can never
    // double-decrement a number.
    const clues = useMemo(() => (game == null ? null : computeClues(game)), [game]);
    const sidenums = useMemo(
        () => (clues == null || board == null ? null : progressSidenums(clues, board)),
        [clues, board]
    );

    return (
        <GameContext.Provider value={{
            sizex: game?.sizex ?? null,
            sizey: game?.sizey ?? null,
            game,
            board,
            onGenerateGame,
            playCell,
            sidenums,
            connection,
            onlinePlayers,
        }}>
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
