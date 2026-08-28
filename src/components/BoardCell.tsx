import { useState } from "react";
import { useAuth } from "../ctx/userCtx";
import { handleClick } from "../lib/funcs";

export interface BoardCellProps {
    cell: number,
    col: number,
    fila: number
}

export default function BoardCell({ cell, col, fila }: BoardCellProps) {
    const { username } = useAuth();
    const [ value, setValue ] = useState<boolean | null>(null); 

    if (username == null) return;

    return (
        <td
            key={col}
            onClick={() => {
                if (value == null) handleClick(username, fila, col, true, (val) => { setValue(val) }, )
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (value == null) handleClick(username, fila, col, false, (val) => { setValue(val) })
            }}
            className={`nonogram-cell cursor-pointer border border-border/60 p-0 transition-colors duration-100 
                                    ${value != null ? (value ? "bg-bg hover:bg-accent-bg" : "bg-text-h") : "bg-slate-500 hover:bg-slate-600"}`}
            style={{
                width: cell,
                height: cell,
                borderLeftWidth: col % 5 === 0 ? "2px" : undefined,
                borderLeftColor: col % 5 === 0 ? "var(--border)" : undefined,
                borderTopWidth: fila % 5 === 0 ? "2px" : undefined,
                borderTopColor: fila % 5 === 0 ? "var(--border)" : undefined,
            }}
        />
    );
}