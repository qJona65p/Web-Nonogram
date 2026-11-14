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
        <td
            onClick={() => {
                if (!locked) onPlay(fila, col, true);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (!locked) onPlay(fila, col, false);
            }}
            className={`nonogram-cell border border-border/60 p-0 transition-colors duration-100 ${
                locked ? "cursor-default" : "cursor-pointer"
            } ${value != null ? (value ? "bg-bg hover:bg-accent-bg" : "bg-text-h") : "bg-slate-500 hover:bg-slate-600"}`}
            style={{
                width: cell,
                height: cell,
                borderLeftWidth: col % 5 === 0 ? "2px" : undefined,
                borderLeftColor: col % 5 === 0 ? "var(--border)" : undefined,
                borderTopWidth: fila % 5 === 0 ? "2px" : undefined,
                borderTopColor: fila % 5 === 0 ? "var(--border)" : undefined,
            }}
        ></td>
    );
}

export default memo(BoardCell);
