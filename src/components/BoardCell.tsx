import { memo } from "react";

export interface BoardCellProps {
    cell: number;
    col: number;
    fila: number;
    value: boolean | null;
    disabled: boolean;
    onPlay: (x: number, y: number, intent: boolean) => void;
}

function BoardCell({ cell, col, fila, value, disabled, onPlay }: BoardCellProps) {
    const locked = disabled || value != null;

    return (
        <div
            data-x={fila}
            data-y={col}
            onClick={() => {
                if (!locked) onPlay(fila, col, true);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (!locked) onPlay(fila, col, false);
            }}
            className={`nonogram-cell border-r border-b border-border/60 p-0 transition-colors duration-100 ${
                locked ? "cursor-default" : "cursor-pointer"
            } ${value != null ? (value ? "bg-bg hover:bg-accent-bg" : "bg-text-h") : "bg-slate-500 hover:bg-slate-600"}`}
            style={{
                width: cell,
                height: cell,
                boxSizing: "border-box",
                borderRightWidth: (col + 1) % 5 === 0 ? 2 : undefined,
                borderBottomWidth: (fila + 1) % 5 === 0 ? 2 : undefined,
            }}
        ></div>
    );
}

export default memo(BoardCell);
