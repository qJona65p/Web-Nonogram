import { useMemo } from "react";
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

    // Hover only changes the overlays, so keep the 2,500 cells (50x50) stable.
    const cells = useMemo(() => {
        const result = [];

        for (let fila = 0; fila < rows; fila++) {
            for (let col = 0; col < cols; col++) {
                result.push(
                    <BoardCell
                        key={`${fila}:${col}`}
                        cell={cell}
                        col={col}
                        fila={fila}
                        value={board[fila][col]}
                        disabled={disabled}
                        onPlay={playCell}
                    />
                );
            }
        }

        return result;
    }, [board, cell, disabled, playCell, rows, cols]);

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
                {cells}
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
