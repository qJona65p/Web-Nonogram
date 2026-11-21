/**
 * Format an elapsed duration for the HUD.
 *
 * Long, multi-day games drop the seconds so the timer stays narrow:
 *   under an hour     -> 07:42
 *   under a day       -> 3:07:42
 *   a day or more     -> 3d 07:12
 */
export function formatElapsed(ms: number): string {
    const safe = Number.isFinite(ms) ? ms : 0;
    const totalSeconds = Math.max(0, Math.floor(safe / 1000));
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / 86400);

    if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}`;
    if (totalSeconds >= 3600) return `${hours}:${pad(minutes)}:${pad(seconds)}`;

    return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
    return String(value).padStart(2, '0');
}
