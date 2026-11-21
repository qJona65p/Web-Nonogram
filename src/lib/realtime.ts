import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { ConnectionStatus, GameStats, Move, OnlinePlayer } from './types';
import { colorFor } from './funcs';

const CHANNEL_NAME = 'nonogram:global';

interface PresenceMeta {
    username: string;
    tabId: string;
}

export interface GameHandlers {
    onMoves: (moves: Move[], stats?: GameStats) => void;
    onPresence: (players: OnlinePlayer[]) => void;
    onStatus: (status: ConnectionStatus) => void;
    onSubscribed: () => void;
    onReset: () => void;
}

export interface GameChannel {
    sendMoves: (moves: Move[], stats?: GameStats) => void;
    announceReset: () => void;
    unsubscribe: () => void;
}

export function subscribeToGame(username: string, handlers: GameHandlers): GameChannel {
    handlers.onStatus('connecting');

    const key = `${username}:${tabId()}`;
    const channel: RealtimeChannel = supabase.channel(CHANNEL_NAME, {
        config: { presence: { key } },
    });

    channel
        .on('broadcast', { event: 'moves' }, ({ payload }) => {
            const data = payload as { moves?: Move[] } & GameStats;

            handlers.onMoves(data.moves ?? [], {
                gameId: data.gameId,
                livesLost: data.livesLost,
                ended: data.ended,
                endedAt: data.endedAt,
            });
        })
        .on('broadcast', { event: 'reset' }, () => {
            handlers.onReset();
        })
        // Broadcast is the primary transport because it does not require the
        // table to be added to the Realtime publication. If `movements` is
        // published, Postgres changes give a durable second copy of each move;
        // duplicates are harmless because a cell only resolves once.
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'movements' },
            (payload) => {
                handlers.onMoves([payload.new as Move]);
            }
        )
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState<PresenceMeta>();
            const players = new Map<string, OnlinePlayer>();

            for (const metas of Object.values(state)) {
                for (const meta of metas) {
                    if (!meta?.username || players.has(meta.username)) continue;
                    players.set(meta.username, {
                        username: meta.username,
                        color: colorFor(meta.username),
                    });
                }
            }

            handlers.onPresence([...players.values()]);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                handlers.onStatus('live');
                void channel.track({ username, tabId: key });
                handlers.onSubscribed();
            } else if (
                status === 'CHANNEL_ERROR' ||
                status === 'TIMED_OUT' ||
                status === 'CLOSED'
            ) {
                handlers.onStatus('offline');
            }
        });

    return {
        sendMoves: (moves, stats) => {
            void channel.send({
                type: 'broadcast',
                event: 'moves',
                payload: { moves, ...stats },
            });
        },
        announceReset: () => {
            void channel.send({ type: 'broadcast', event: 'reset', payload: {} });
        },
        unsubscribe: () => {
            void supabase.removeChannel(channel);
        },
    };
}

/** A stable per-tab id, so two tabs with the same username are both visible. */
function tabId(): string {
    const storageKey = 'nonogram-tab-id';
    let id = sessionStorage.getItem(storageKey);

    if (id == null) {
        id = Math.random().toString(36).slice(2);
        sessionStorage.setItem(storageKey, id);
    }

    return id;
}
