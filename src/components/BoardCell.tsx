import { useState } from "react";
import { useAuth } from "../ctx/userCtx";
import { handleClick } from "../lib/funcs";

export interface BoardCellProps {
    cell: number,
    col: number,
    fila: number,
    initialValue: boolean | null
}

export default function BoardCell({ cell, col, fila, initialValue }: BoardCellProps) {
    const { username, lives, loseLive } = useAuth();
    const [value, setValue] = useState<boolean | null>(initialValue); 

    if (username == null) return;

    return (
        <td
            key={col}
            onClick={() => {
                console.log("vidas: ", lives);
                if (lives > 0) {
                    if (value == null) handleClick(username, fila, col, true, (val) => { setValue(val) }, () => { loseLive() } )
                }
                else console.log("morto");
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                console.log("vidas: ", lives);
                if (lives > 0) {
                    if (value == null) handleClick(username, fila, col, false, (val) => { setValue(val) }, () => { loseLive() } )
                }
                    else console.log("morto");
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