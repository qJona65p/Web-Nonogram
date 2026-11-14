import { useAuth } from "../ctx/userCtx";
import { useGame } from "../ctx/gameCtx";
import BoardCell from "./BoardCell";

interface BoardProps {
    board: (boolean | null)[][];
    cell: number;
}

export default function Board({ board, cell }: BoardProps) {
    const { sizex, sizey, playCell } = useGame();
    const { lives } = useAuth();

    if (sizex == null || sizey == null) return null;

    const filas = new Array(sizex).fill(null).map((_, i) => i);
    const columnas = new Array(sizey).fill(null).map((_, i) => i);
    const disabled = lives <= 0;

    return (
        <table
            className="overflow-hidden rounded-lg border-2 border-border"
            style={{ borderCollapse: "collapse" }}
        >
            <tbody>
            {filas.map((fila) => (
                <tr key={fila}>
                    {columnas.map((col) =>
                        <BoardCell
                            key={col}
                            cell={cell}
                            col={col}
                            fila={fila}
                            value={board[fila][col]}
                            disabled={disabled}
                            onPlay={playCell}
                        />
                    )}
                </tr>
            ))}
            </tbody>
        </table>
    );
}
