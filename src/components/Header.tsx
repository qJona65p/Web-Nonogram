import { useAuth } from "../ctx/userCtx";

export default function Header() {
    const { username, logout } = useAuth();

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

                {/* Right: user + logout */}
                <div className="flex items-center justify-self-end gap-3">
                    {username && (
                        <>
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