import { useAuth, MAX_LIVES } from "../ctx/userCtx";

export default function Status() {
    const { lives } = useAuth();
    const lost = lives <= 0;

    return (
        <div
            className={`flex items-center gap-0.5 ${lost ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
            role="status"
            aria-label={lost ? "No lives left" : `${lives} of ${MAX_LIVES} lives remaining`}
        >
            {Array.from({ length: MAX_LIVES }, (_, i) => (
                <Heart key={i} filled={i < lives} />
            ))}
        </div>
    );
}

function Heart({ filled }: { filled: boolean }) {
    return (
        <svg
            viewBox="0 0 24 20"
            width={28}
            height={28} 
            className="shrink-0"
            fill={filled ? "#e11d48" : "none"}
            stroke={filled ? "#e11d48" : "var(--border)"}
            strokeWidth={filled ? 0 : 2.5}
        >
            <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.1 1.7 6.6 4.6 5.2c2.2-1.05 4.6-.3 5.9 1.5l1.5 2 1.5-2c1.3-1.8 3.7-2.55 5.9-1.5 2.9 1.4 3.6 4.9 1.9 7.7C18.7 16.65 12 21 12 21z" />
        </svg>
    );
}