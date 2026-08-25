import type { Game } from "../lib/types";
import { changeColor } from "../lib/funcs";

interface BoardProps {
    game: Game;
    cell: number;
}

export default function Board({ game, cell }: BoardProps) {
    const filas = new Array(game.sizex).fill(null).map((_, i) => i);
    const columnas = new Array(game.sizey).fill(null).map((_, i) => i);

    return (
        <table
            className="overflow-hidden rounded-lg border-2 border-border"
            style={{ borderCollapse: "collapse" }}
        >
            <tbody>
            {filas.map((fila) => (
                <tr key={fila}>
                    {columnas.map((col) => {
                        const filled = game.values[fila][col];
                        return (
                            <td
                                key={col}
                                onClick={changeColor}
                                className={`nonogram-cell cursor-pointer border border-border/60 p-0 transition-colors duration-100 ${filled ? "bg-bg hover:bg-accent-bg" : "bg-text-h"
                                    }`}
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
    })}
                </tr>
            ))}
            </tbody>
        </table>
    );
}