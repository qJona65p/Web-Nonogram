import { useAuth } from "../ctx/userCtx";
import { useGame } from "../ctx/gameCtx";

export default function Header() {
    const { username, logout } = useAuth();
    const { connection, onlinePlayers } = useGame();

    const connectionLabel =
        connection === 'live' ? "Live" : connection === 'connecting' ? "Connecting…" : "Offline";

    return(
        <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-3 items-center px-4 py-3 sm:px-6">
                {/* Left: brand mark */}
                <div className="flex items-center gap-2">
                    <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 text-accent"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" stroke="none" />
                    </svg>
                    <span className="hidden text-sm font-medium text-text sm:inline">Nonograma</span>
                </div>

                {/* Center: title */}
                <h1 className="justify-self-center whitespace-nowrap text-lg font-semibold tracking-wide text-text-h sm:text-xl">
                    Nonograma Online
                </h1>

                {/* Right: connection, players, user, logout */}
                <div className="flex items-center justify-self-end gap-3">
                    {username && (
                        <>
                            <span
                                title={connectionLabel}
                                aria-label={connectionLabel}
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                    connection === 'live'
                                        ? "bg-emerald-500"
                                        : connection === 'connecting'
                                        ? "animate-pulse bg-amber-400"
                                        : "bg-rose-500"
                                }`}
                            />

                            {onlinePlayers.length > 0 && (
                                <div
                                    className="hidden items-center -space-x-1.5 sm:flex"
                                    aria-label={`${onlinePlayers.length} player${onlinePlayers.length === 1 ? "" : "s"} online`}
                                >
                                    {onlinePlayers.slice(0, 4).map((player) => (
                                        <span
                                            key={player.username}
                                            title={player.username}
                                            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-white"
                                            style={{ backgroundColor: player.color }}
                                        >
                                            {player.username.slice(0, 1).toUpperCase()}
                                        </span>
                                    ))}
                                    {onlinePlayers.length > 4 && (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg bg-code-bg text-[10px] font-bold text-text">
                                            +{onlinePlayers.length - 4}
                                        </span>
                                    )}
                                </div>
                            )}

                            <span className="hidden max-w-[10rem] truncate rounded-full bg-code-bg px-3 py-1 text-sm text-text sm:inline">
                                {username}
                            </span>
                            <button
                                onClick={logout}
                                className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-accent-border hover:bg-accent-bg hover:text-accent"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
