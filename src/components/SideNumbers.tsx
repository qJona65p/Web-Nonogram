import { useGame } from "../ctx/gameCtx";

interface SideProps {
    cell: number;
    hoveredRow: number | null;
}

export default function SideNumbers({ cell, hoveredRow }: SideProps) {
    const { sizex, sidenums } = useGame();
    if (sidenums == null || sizex == null) return null;

    const items = sidenums.Right;
    const filas = new Array(sizex).fill(null).map((_, i) => i);
    const clueFont = Math.max(6, Math.min(16, cell * 0.62));
    const gap = Math.max(1, Math.round(cell * 0.08));

    return (
        <div
            className="grid justify-self-end"
            style={{ gridTemplateRows: `repeat(${sizex}, ${cell}px)` }}
        >
            {filas.map((fila) => {
                const runs = items[fila] ?? [];
                const emptyRow = runs.length === 0;
                const highlighted = hoveredRow === fila;

                return (
                    <div
                        key={fila}
                        className={`flex items-center justify-end tabular-nums transition-colors duration-100 ${
                            highlighted ? "bg-accent-bg text-accent" : "text-text"
                        }`}
                        style={{
                            height: cell,
                            paddingRight: gap,
                            paddingLeft: gap,
                            gap,
                            fontSize: clueFont,
                            lineHeight: 1,
                        }}
                    >
                        {emptyRow ? (
                            <span className="font-medium">0</span>
                        ) : (
                            runs.map((run, index) => (
                                <span
                                    key={index}
                                    className={run[1] <= 0 ? "font-bold" : "font-medium"}
                                >
                                    {run[0]}
                                </span>
                            ))
                        )}
                    </div>
                );
            })}
        </div>
    );
}
