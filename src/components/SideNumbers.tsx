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
    const clueFont = Math.max(10, Math.min(16, cell * 0.7));
    const gap = Math.max(1, Math.round(cell * 0.08)) + 3;

    return (
        <div
            className="grid justify-self-end"
            style={{ gridTemplateRows: `repeat(${sizex}, ${cell}px)` }}
        >
            {filas.map((fila) => {
                const runs = items[fila] ?? [];
                const emptyRow = runs.length === 0;
                const highlighted = hoveredRow === fila;
                const lineCompleted = !emptyRow && runs.every((run) => run[1] <= 0);

                return (
                    <div
                        key={fila}
                        className={`flex items-center justify-end tabular-nums transition-[color,background-color,box-shadow] duration-150 ${
                            highlighted ? "bg-accent-bg" : ""
                        } ${highlighted || lineCompleted ? "text-accent" : "text-text"}`}
                        style={{
                            height: cell,
                            paddingRight: gap,
                            paddingLeft: gap,
                            gap,
                            fontSize: clueFont,
                            lineHeight: 1,
                            boxShadow: lineCompleted ? "inset -2px 0 0 var(--accent)" : undefined,
                        }}
                    >
                        {emptyRow ? (
                            <span className="font-medium">0</span>
                        ) : (
                            runs.map((run, index) => {
                                const completed = run[1] <= 0;

                                return (
                                    <span
                                        key={index}
                                        className={
                                            completed
                                                ? "font-bold text-accent/40 decoration-2"
                                                : "font-medium"
                                        }
                                    >
                                        {run[0]}
                                    </span>
                                );
                            })
                        )}
                    </div>
                );
            })}
        </div>
    );
}
