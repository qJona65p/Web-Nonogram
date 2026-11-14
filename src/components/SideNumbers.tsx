import { useGame } from "../ctx/gameCtx";

interface SideProps {
    cell: number;
}

export default function SideNumbers({ cell }: SideProps) {
    const { sizex, sidenums } = useGame()
    if (sidenums == null || sizex == null) return;

    const Items = sidenums.Right;

    const maxItems = Math.max(1, ...Items.map(fila => fila.length));

    const filas = new Array(sizex).fill(null).map((_, i) => i);
    const columnas = new Array(maxItems).fill(null).map((_, i) => i);

    return (
        <table>
            <tbody>
                {filas.map((fila) => {
                const items = Items[fila] ?? [];
                // Si la fila no existe o está vacía
                const emptyRow = items.length === 0;

                // Espacios necesarios para alinear a la derecha
                const spaces = maxItems - items.length;

                return (
                    <tr key={fila} style={{ height: cell }}>
                        {columnas.map((col) => {
                            const run = items[col - spaces];
                            const completed = run != undefined && run[1] <= 0;

                            return (
                                <td key={col} className="px-1.5 text-right align-middle">
                                    <div className={`text-[clamp(9px,1.4vmin,16px)] leading-none tabular-nums text-text
                                        ${completed ? "font-bold" : "font-medium"}`}>
                                    {emptyRow && col === maxItems - 1
                                        ? "0" : col >= spaces
                                        ? run?.[0] ?? " " : " "}
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                );
                })}
            </tbody>
        </table>
    );
}
