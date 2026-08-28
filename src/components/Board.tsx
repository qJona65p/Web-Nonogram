import { useGame } from "../ctx/gameCtx";
import BoardCell from "./BoardCell";

interface BoardProps {
    playerGame: (boolean | null)[][];
    cell: number;
}

export default function Board({ playerGame, cell }: BoardProps) {
    const { sizex, sizey } = useGame();

    const filas = new Array(sizex).fill(null).map((_, i) => i);
    const columnas = new Array(sizey).fill(null).map((_, i) => i);

    return (
        <table
            className="overflow-hidden rounded-lg border-2 border-border"
            style={{ borderCollapse: "collapse" }}
        >
            <tbody>
            {filas.map((fila) => (
                <tr key={fila}>
                    {columnas.map((col) => 
                        <BoardCell key={col} cell={cell} col={col} fila={fila} initialValue={playerGame[fila][col]} />
                    )}
                </tr>
            ))}
            </tbody>
        </table>
    );
}