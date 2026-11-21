import { memo, useMemo } from "react";
import { useAuth } from "../ctx/userCtx";
import { useGame } from "../ctx/gameCtx";
import BoardCell from "./BoardCell";

export interface HoveredCell {
    x: number;
    y: number;
}

interface BoardProps {
    board: (boolean | null)[][];
    cell: number;
    hovered: HoveredCell | null;
    onHover: (cell: HoveredCell | null) => void;
}

export default function Board({ board, cell, hovered, onHover }: BoardProps) {
    const { sizex, sizey, game, playCell } = useGame();
    const { lives } = useAuth();

    const rows = sizex ?? 0;
    const cols = sizey ?? 0;
    const disabled = lives <= 0 || (game?.ended ?? false);

    // Hover only changes the overlays, so the rows can stay memoized while the
    // pointer moves across the board. `applyMoves` keeps untouched rows
    // referentially stable, so a single move only re-renders its own row.
    const rowIndices = useMemo(
        () => Array.from({ length: rows }, (_, index) => index),
        [rows]
    );

    if (sizex == null || sizey == null) return null;

    const width = sizey * cell;
    const height = sizex * cell;

    function handlePointer(event: React.PointerEvent<HTMLDivElement>) {
        const target = (event.target as HTMLElement).closest<HTMLElement>("[data-x][data-y]");
        if (target == null) return;

        const x = Number(target.dataset.x);
        const y = Number(target.dataset.y);

        if (!Number.isInteger(x) || !Number.isInteger(y)) return;
        if (hovered?.x === x && hovered?.y === y) return;

        onHover({ x, y });
    }

    return (
        <div
            className="relative overflow-hidden rounded-lg"
            style={{
                width,
                height,
                boxShadow: "0 0 0 2px var(--border)",
            }}
            onPointerOver={handlePointer}
            onPointerLeave={() => onHover(null)}
        >
            <div
                className="grid"
                style={{
                    width,
                    height,
                    gridTemplateColumns: `repeat(${sizey}, ${cell}px)`,
                    gridTemplateRows: `repeat(${sizex}, ${cell}px)`,
                }}
            >
                {rowIndices.map((fila) => (
                    <BoardRow
                        key={fila}
                        fila={fila}
                        row={board[fila]}
                        cols={cols}
                        cell={cell}
                        disabled={disabled}
                        onPlay={playCell}
                    />
                ))}
            </div>

            {hovered && (
                <>
                    <div
                        className="pointer-events-none absolute bg-accent-bg"
                        style={{
                            top: hovered.x * cell,
                            left: 0,
                            width,
                            height: cell,
                            zIndex: 1,
                        }}
                    />
                    <div
                        className="pointer-events-none absolute bg-accent-bg"
                        style={{
                            top: 0,
                            left: hovered.y * cell,
                            width: cell,
                            height,
                            zIndex: 1,
                        }}
                    />
                    <div
                        className="pointer-events-none absolute border border-accent-border"
                        style={{
                            top: hovered.x * cell,
                            left: hovered.y * cell,
                            width: cell,
                            height: cell,
                            boxSizing: "border-box",
                            zIndex: 2,
                        }}
                    />
                </>
            )}
        </div>
    );
}

interface BoardRowProps {
    fila: number;
    row: (boolean | null)[] | undefined;
    cols: number;
    cell: number;
    disabled: boolean;
    onPlay: (x: number, y: number, intent: boolean) => void;
}

/**
 * One row of cells. Memoized so a move in another row leaves the DOM for this
 * row untouched; at 100x100 that is the difference between 100 and 10,000
 * cells being reconciled per click.
 */
const BoardRow = memo(function BoardRow({ fila, row, cols, cell, disabled, onPlay }: BoardRowProps) {
    return (
        <>
            {Array.from({ length: cols }, (_, col) => (
                <BoardCell
                    key={col}
                    cell={cell}
                    col={col}
                    fila={fila}
                    value={row?.[col] ?? null}
                    disabled={disabled}
                    onPlay={onPlay}
                />
            ))}
        </>
    );
});
