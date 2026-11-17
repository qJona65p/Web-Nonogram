import { useGame } from "../ctx/gameCtx";

interface UpperProps {
    cell: number;
    hoveredCol: number | null;
}

export default function UpperNumbers({ cell, hoveredCol }: UpperProps) {
    const { sizey, sidenums } = useGame();
    if (sidenums == null || sizey == null) return null;

    const items = sidenums.Up;
    const columnas = new Array(sizey).fill(null).map((_, i) => i);
    const clueFont = Math.max(10, Math.min(16, cell * 0.7));
    const gap = Math.max(1, Math.round(cell * 0.08));

    return (
        <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${sizey}, ${cell}px)` }}
        >
            {columnas.map((col) => {
                const runs = items[col] ?? [];
                const emptyColumn = runs.length === 0;
                const highlighted = hoveredCol === col;
                const lineCompleted = !emptyColumn && runs.every((run) => run[1] <= 0);

                return (
                    <div
                        key={col}
                        className={`flex flex-col items-center justify-end tabular-nums transition-[color,background-color,box-shadow] duration-150 ${
                            highlighted ? "bg-accent-bg" : ""
                        } ${highlighted || lineCompleted ? "text-accent" : "text-text"}`}
                        style={{
                            width: cell,
                            paddingTop: gap,
                            paddingBottom: gap,
                            gap,
                            fontSize: clueFont,
                            lineHeight: 1,
                            boxShadow: lineCompleted ? "inset 0 -2px 0 var(--accent)" : undefined,
                        }}
                    >
                        {emptyColumn ? (
                            <span className="font-medium">0</span>
                        ) : (
                            runs.map((run, index) => {
                                const completed = run[1] <= 0;

                                return (
                                    <span
                                        key={index}
                                        className={
                                            completed
                                                ? "font-bold text-accent/50 line-through decoration-2"
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
