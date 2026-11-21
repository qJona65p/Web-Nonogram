import { useEffect, useState } from "react";
import { formatElapsed } from "../lib/time";

interface GameTimerProps {
    /** ISO timestamp of when the puzzle was created. */
    startedAt: string;
    /** ISO timestamp of when the puzzle ended, or null while running. */
    endedAt: string | null;
}

/**
 * Elapsed time for the current puzzle. The value is derived from the stored
 * timestamps on every tick, so reloading the page (or leaving the tab in the
 * background for a day) never drifts.
 */
export default function GameTimer({ startedAt, endedAt }: GameTimerProps) {
    const running = endedAt == null;

    // Kept local to this component so the board does not re-render every second.
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!running) return;

        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [running]);

    const start = Date.parse(startedAt);
    const end = endedAt == null ? now : Date.parse(endedAt);
    const elapsed = Number.isFinite(start) && Number.isFinite(end) ? end - start : 0;

    return (
        <span
            className="flex items-center gap-1 text-[13px] font-semibold tabular-nums text-text-h"
            title={`Started ${new Date(startedAt).toLocaleString()}`}
        >
            <svg
                viewBox="0 0 24 24"
                width={12}
                height={12}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-text"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
            </svg>
            <span role="timer" aria-live="off">{formatElapsed(elapsed)}</span>
        </span>
    );
}
