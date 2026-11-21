'use client';

/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ConnectionStatus, GameStats, Move, OnlinePlayer, SideNums, StoredGame } from '../lib/types';
import { getGame, getMoves, playTurn, resetGame, submitUsername } from '../lib/supabase';
import { useAuth } from './userCtx';
import {
    applyMoves,
    clamp,
    computeClues,
    generateGame,
    getBlankGame,
    normalizeDifficulty,
    progressSidenums,
    sameGame,
} from '../lib/funcs';
import {
    DEFAULT_BOARD_SIZE,
    DEFAULT_DIFFICULTY,
    MAX_BOARD_SIZE,
    MAX_DIFFICULTY,
    MIN_BOARD_SIZE,
    MIN_DIFFICULTY,
} from '../lib/constants';
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

                if (current == null) {
                    current = await resetGame(
                        generateGame(
                            DEFAULT_BOARD_SIZE,
                            DEFAULT_BOARD_SIZE,
                            normalizeDifficulty(DEFAULT_DIFFICULTY)
                        ),
                        username,
                        DEFAULT_DIFFICULTY
                    );
                }

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

    const applyRemoteMoves = useCallback((moves: Move[], stats?: GameStats) => {
        const current = latest.current.game;
        const visible = boardRef.current;
        const gameId = typeof stats?.gameId === 'number' ? stats.gameId : undefined;

        // A broadcast from a game we already replaced must not leak moves or
        // stats (lives lost, ended) into the new puzzle.
        if (gameId != null && current != null && gameId !== current.id) return;

        if (current != null && visible != null) {
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

            if (valid.length > 0) commitBoard(applyMoves(visible, valid));
        }

        if (stats == null) return;

        // Broadcasts are client-sent, so keep obviously broken values out.
        const livesLost =
            typeof stats.livesLost === 'number' &&
            Number.isInteger(stats.livesLost) &&
            stats.livesLost >= 0
                ? stats.livesLost
                : undefined;
        const ended = typeof stats.ended === 'boolean' ? stats.ended : undefined;
        const endedAt =
            typeof stats.endedAt === 'string' && Number.isFinite(Date.parse(stats.endedAt))
                ? stats.endedAt
                : undefined;

        if (livesLost === undefined && ended === undefined && endedAt === undefined) return;

        // If a client reports the end without a timestamp, freeze the timer at
        // the moment we hear about it rather than letting it keep running.
        const endedFallback =
            ended === true && endedAt === undefined ? new Date().toISOString() : null;

        // Broadcasts carry game-wide stats so counters and the timer update
        // without waiting for a refetch.
        setGame((value) => {
            if (value == null) return value;

            const hasEnded = value.ended || ended === true;

            return {
                ...value,
                // lives lost only grows within a game, so an out-of-order
                // broadcast must not move the counter backwards.
                livesLost: livesLost === undefined
                    ? value.livesLost
                    : Math.max(value.livesLost, livesLost),
                ended: hasEnded,
                endedAt: hasEnded
                    ? value.endedAt ?? endedAt ?? endedFallback
                    : value.endedAt,
            };
        });
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

            channelRef.current?.sendMoves(result.moves ?? [], {
                gameId: current.game.id,
                livesLost: result.livesLost,
                ended: result.ended,
                endedAt: result.endedAt,
            });

            syncLives(result.lives ?? current.lives);

            setGame((value) => value == null ? value : {
                ...value,
                livesLost: result.livesLost == null
                    ? value.livesLost
                    : Math.max(value.livesLost, result.livesLost),
                ended: result.ended ?? value.ended,
                endedAt: result.ended
                    ? (result.endedAt ?? value.endedAt ?? new Date().toISOString())
                    : value.endedAt,
            });
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

        // Keep externally supplied values inside the shared bounds, so a new
        // caller (or a future programmatic trigger) cannot create a puzzle the
        // UI and the sizing code were not designed for.
        const rows = Math.round(clamp(sizex, MIN_BOARD_SIZE, MAX_BOARD_SIZE));
        const cols = Math.round(clamp(sizey, MIN_BOARD_SIZE, MAX_BOARD_SIZE));
        const level = Math.round(clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY));

        try {
            const next = await resetGame(
                generateGame(rows, cols, normalizeDifficulty(level)),
                name,
                level
            );

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
