interface UpperProps {
    sizey: number;
    Items: number[][];
    cell: number;
}

export default function SideNumbers({ sizey, Items, cell }: UpperProps) {
    const maxItems = Math.max(...Items.map(fila => fila.length));

    const filas = new Array(maxItems).fill(null).map((_, i) => i);
    const columnas = new Array(sizey).fill(null).map((_, i) => i);

    return (
        <table>
            <tbody>
                {filas.map((fila) => (
                <tr key={fila}>
                    {columnas.map((col) => {
                    // Cuántos espacios necesita esta columna
                    const spaces = maxItems - (Items[col]?.length ?? 0);
                    // La columna no tiene ningún número
                    const emptyColumn = !Items[col] || Items[col].length === 0;

                    return (
                        <td key={col} className="px-0.5 pb-1 text-center align-bottom" style={{ width: cell }}>
                            <div className="text-[clamp(9px,1.4vmin,14px)] font-medium leading-none tabular-nums text-text">
                                {emptyColumn && fila === maxItems - 1
                                    ? "0" : fila >= spaces
                                    ? Items[col][fila - spaces] : " "}
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