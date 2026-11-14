import { useGame } from "../ctx/gameCtx";

interface UpperProps {
    cell: number;
}

export default function UpperNumbers({ cell }: UpperProps) {
    const { sizey, sidenums } = useGame()
    if (sidenums == null || sizey == null) return;

    const Items = sidenums.Up;

    const maxItems = Math.max(1, ...Items.map(columna => columna.length));

    const filas = new Array(maxItems).fill(null).map((_, i) => i);
    const columnas = new Array(sizey).fill(null).map((_, i) => i);

    return (
        <table>
            <tbody>
                {filas.map((fila) => (
                <tr key={fila}>
                    {columnas.map((col) => {
                    const items = Items[col] ?? [];
                    // Cuántos espacios necesita esta columna
                    const spaces = maxItems - items.length;
                    // La columna no tiene ningún número
                    const emptyColumn = items.length === 0;
                    const run = items[fila - spaces];
                    const completed = run != undefined && run[1] <= 0;

                    return (
                        <td key={col} className="px-0.5 pb-1 text-center align-bottom" style={{ width: cell }}>
                            <div className={`text-[clamp(9px,1.4vmin,16px)] leading-none tabular-nums text-text
                                    ${completed ? "font-bold" : "font-medium"}`}>
                                {emptyColumn && fila === maxItems - 1
                                    ? "0" : fila >= spaces
                                    ? run?.[0] ?? " " : " "}
                            </div>
                        </td>
                    );
                    })}
                </tr>
                ))}
            </tbody>
        </table>
    );
}
