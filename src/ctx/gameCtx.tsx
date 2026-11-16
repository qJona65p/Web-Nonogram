'use client';

/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ConnectionStatus, Move, OnlinePlayer, SideNums, StoredGame } from '../lib/types';
import { getGame, getMoves, playTurn, resetGame, submitUsername } from '../lib/supabase';
import { useAuth } from './userCtx';
import {
    applyMoves,
    computeClues,
    generateGame,
    getBlankGame,
    progressSidenums,
    sameGame,
} from '../lib/funcs';
import { subscribeToGame, type GameChannel } from '../lib/realtime';

interface GameCtxProps {
    sizex: number | null;
    sizey: number | null;
    game: StoredGame | null;
    board: (boolean | null)[][] | null;
    onGenerateGame: (sizex: number, sizey: number, difficulty: number) => Promise<void>;
    playCell: (x: number, y: number, intent: boolean) => void;
    sidenums: SideNums | null;
    connection: ConnectionStatus;
    onlinePlayers: OnlinePlayer[];
}

const GameContext = createContext<GameCtxProps | undefined>(undefined);

// A reset is atomic, so a null read is most likely just latency.
const RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadGameWithRetries(): Promise<StoredGame | null> {
    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
        const game = await getGame();
        if (game != null) return game;
        if (attempt < RETRY_ATTEMPTS - 1) await sleep(RETRY_DELAY_MS);
    }

    return null;
}

export function GameProvider({ children }: { children: ReactNode }) {
    const { username, lives, syncLives, resetLives } = useAuth();

    const [game, setGame] = useState<StoredGame | null>(null);
    const [board, setBoard] = useState<(boolean | null)[][] | null>(null);
    const [connection, setConnection] = useState<ConnectionStatus>('connecting');
    const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);

    const channelRef = useRef<GameChannel | null>(null);
    const boardRef = useRef<(boolean | null)[][] | null>(null);
    const turnInFlight = useRef(false);
    const latest = useRef({ game, username, lives });

    // Keep the click handler stable (so board cells can be memoized) while
    // still reading the freshest state.
    useEffect(() => {
        latest.current = { game, username, lives };
    }, [game, username, lives]);

    // Board changes always go through this ref so move responses can be
    // computed without side effects inside a React state updater.
    const commitBoard = useCallback((next: (boolean | null)[][] | null) => {
        boardRef.current = next;
        setBoard(next);
    }, []);

    // Initial load. If a logged-in client still sees no game row, create a
    // default one so the first player does not land on a crash.
    useEffect(() => {
        if (username == null) return;
        let cancelled = false;

        (async () => {
            try {
                let current = await loadGameWithRetries();

                if (current == null) current = await resetGame(generateGame(10, 10, 0.5), username);

                const moves = await getMoves();
                if (cancelled) return;

                setGame(current);
                commitBoard(applyMoves(getBlankGame(current.sizex, current.sizey, true) as (boolean | null)[][], moves));
            } catch (error) {
                console.error('Could not load the game', error);
            }
        })();

        return () => { cancelled = true; };
    }, [username, commitBoard]);

    const syncBoard = useCallback(async (mode: 'replace' | 'merge') => {
        const current = await loadGameWithRetries();
        if (current == null) return;

        const moves = await getMoves();
        const previous = latest.current.game;

        // Only merge when the puzzle itself is unchanged and still playable.
        // If someone generated a new puzzle while we were offline, replace the
        // board. A finished game also replaces so the solved board is exact.
        const canMerge =
            mode === 'merge' &&
            previous != null &&
            sameGame(previous, current) &&
            !current.ended;

        const base = canMerge && boardRef.current != null
            ? boardRef.current
            : getBlankGame(current.sizex, current.sizey, true) as (boolean | null)[][];

        setGame(current);
        commitBoard(applyMoves(base, moves));

        // A missed reset broadcast/reconnect is covered by the game id change;
        // `reset_game` already wrote MAX_LIVES for everyone in the database.
        if (previous != null && !sameGame(previous, current)) resetLives();
    }, [commitBoard, resetLives]);

    const applyRemoteMoves = useCallback((moves: Move[]) => {
        const current = latest.current.game;
        const visible = boardRef.current;
        if (current == null || visible == null) return;

        // The server is authoritative for fills; only reject malformed or
        // out-of-range rows here.
        const valid = moves.filter((move) =>
            move != null &&
            Number.isInteger(move.x) &&
            Number.isInteger(move.y) &&
            typeof move.value === 'boolean' &&
            move.x >= 0 &&
            move.y >= 0 &&
            move.x < current.sizex &&
            move.y < current.sizey
        );

        if (valid.length === 0) return;

        commitBoard(applyMoves(visible, valid));
    }, [commitBoard]);

    // One channel per logged-in user. Presence and broadcast make the board
    // collaborative; the database keeps it durable for late joiners.
    useEffect(() => {
        if (username == null) return;

        const channel = subscribeToGame(username, {
            onMoves: applyRemoteMoves,
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
    }, [username, applyRemoteMoves, syncBoard, resetLives]);

    const playCell = useCallback(async (x: number, y: number, intent: boolean) => {
        const current = latest.current;

        if (current.game == null || boardRef.current == null || current.username == null) return;
        if (current.game.ended || current.lives <= 0) return;
        if (turnInFlight.current) return;

        // Reject out-of-range clicks before any RPC round trip.
        if (x < 0 || y < 0 || x >= current.game.sizex || y >= current.game.sizey) return;
        if (boardRef.current[x]?.[y] != null) return;

        const username = current.username;
        const gameId = current.game.id;
        const turn = () => playTurn(username, gameId, x, y, intent);

        turnInFlight.current = true;

        try {
            let result = await turn();

            // The client can outlive its players row (stale session). Recreate
            // it once and retry so the click is not lost.
            if (!result.ok && result.reason === 'unknown_player') {
                await submitUsername(username);
                result = await turn();
            }

            if (!result.ok) {
                if (result.reason === 'no_lives') syncLives(0);
                if (result.reason === 'taken' || result.reason === 'stale_game') {
                    await syncBoard('replace');
                }
                return;
            }

            const next = applyMoves(boardRef.current, result.moves ?? []);
            commitBoard(next);

            channelRef.current?.sendMoves(result.moves ?? []);
            syncLives(result.lives ?? current.lives);

            if (result.ended) {
                setGame((value) => (value == null ? value : { ...value, ended: true }));
            }
        } catch (error) {
            console.error('Could not play turn', error);
            await syncBoard('replace').catch(console.error);
        } finally {
            turnInFlight.current = false;
        }
    }, [commitBoard, syncBoard, syncLives]);

    const onGenerateGame = useCallback(async (sizex: number, sizey: number, difficulty: number) => {
        const name = latest.current.username;
        if (name == null) return;

        try {
            const next = await resetGame(generateGame(sizex, sizey, difficulty / 10), name);

            setGame(next);
            commitBoard(getBlankGame(next.sizex, next.sizey, true) as (boolean | null)[][]);
            resetLives();
            channelRef.current?.announceReset();
        } catch (error) {
            console.error('Could not generate a new game', error);
        }
    }, [commitBoard, resetLives]);

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
