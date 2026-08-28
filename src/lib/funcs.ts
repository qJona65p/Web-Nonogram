import type { Game, SideNums } from "./types";
import { getCellDB, setMovement } from "./supabase";

export function generateGame(sizex: number, sizey: number, difficulty: number): Game {
    if (difficulty > 0.8) difficulty = 0.8;
    if (difficulty < 0.3) difficulty = 0.3;
    
    // Crear un array de X filas por Y columnas lleno de ceros
    let game: boolean[][] = Array.from({ length: sizex }, () =>
        Array(sizey).fill(false)
    );

    for (let x = 0; x < sizex; x++) {
        for (let y = 0; y < sizey; y++) {
            game[x][y] = Math.random() > difficulty;
        }
    }

    return { sizex, sizey, values: game };
}

export function getBlankGame(sizex: number, sizey: number, nulls: boolean = false) {
    return Array.from({ length: sizex }, () => Array(sizey).fill(nulls ? null : false));
}

export function numberCount(game: Game): SideNums{
    let arrayUpNum: number[][] = [];
    let arraySideNum: number[][] = [];

    let count: number = 0;
    let arrayCount: number[] = [];

    for (let x = 0; x < game.sizex; x++) {
        for (let y = 0; y < game.sizey; y++) {
            if (game.values[x][y]){
                count++;
            } else {
                if (count != 0) {
                    arrayCount.push(count);
                    count = 0;
                }
            }
        }
        if (count != 0) {
            arrayCount.push(count);
            count = 0;
        }
        arraySideNum.push(arrayCount);
        arrayCount = [];
    }

    for (let y = 0; y < game.sizey; y++) {
        for (let x = 0; x < game.sizex; x++) {
            if (game.values[x][y]) {
                count++;
            } else {
                if (count != 0) {
                    arrayCount.push(count);
                    count = 0;
                }
            }
        }
        if (count != 0) {
            arrayCount.push(count);
            count = 0;
        }
        arrayUpNum.push(arrayCount);
        arrayCount = [];
    }

    return { Right: arraySideNum, Up: arrayUpNum }
}

export function handleClick(username: string, fila: number, col: number, value: boolean, onChange: (value: boolean) => void, onFail: () => void) {
    getCellDB(fila, col).then((res) => { 
        onChange(res);

        setMovement(username, fila, col, res);

        if (res !== value) onFail()
        
        console.log(res === value ? "ye" : "nu");
    });
}