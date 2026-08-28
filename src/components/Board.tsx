import type { Game } from "../lib/types";
import BoardCell from "./BoardCell";

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
                    {columnas.map((col) => 
                        <BoardCell key={col} cell={cell} col={col} fila={fila} initialValue={game.values[fila][col]} />
                    )}
                </tr>
            ))}
            </tbody>
        </table>
    );
}