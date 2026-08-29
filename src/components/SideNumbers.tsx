import { useGame } from "../ctx/gameCtx";

interface SideProps {
    cell: number;
}

export default function SideNumbers({ cell }: SideProps) {
    const { sizex, sidenums, sidenumCompleted } = useGame()
    if (sidenums == null) return;

    const Items = sidenums.Right;

    const maxItems = Math.max(...Items.map(fila => fila.length), 0);

    const filas = new Array(sizex).fill(null).map((_, i) => i);
    const columnas = new Array(maxItems).fill(null).map((_, i) => i);

    return (
        <table>
            <tbody>
                {filas.map((fila) => {
                // Si la fila no existe o está vacía
                const emptyRow = !Items[fila] || Items[fila].length === 0;

                // Espacios necesarios para alinear a la derecha
                const spaces = maxItems - (Items[fila]?.length ?? 0);

                return (
                    <tr key={fila} style={{ height: cell }}>
                        {columnas.map((col) => (
                            <td key={col} className="px-1.5 text-right align-middle">
                                <div className={`text-[clamp(9px,1.4vmin,16px)] leading-none tabular-nums text-text ${sidenumCompleted}
                                    ${sidenums.Right[fila][col - spaces] != undefined && sidenums.Right[fila][col - spaces][1] <= 0 ? "font-bold" : "font-medium"}`}>
                                {emptyRow && col === maxItems - 1
                                    ? "0" : col >= spaces
                                    ? Items[fila][col - spaces][0] : " "}
                            </div>
                        </td>
                        ))}
                    </tr>
                );
                })}
            </tbody>
        </table>
    );
}

