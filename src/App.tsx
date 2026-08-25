import Login from "./components/Login";
import { useAuth } from "./ctx/userCtx";
import { generateGame, numberCount } from "./lib/funcs";
import { useEffect, useState } from "react";
import { getGame, setGameDB } from "./lib/supabase";
import { type SideNums, type Game } from "./lib/types";
import GameConfigs from "./components/GameConfigs";
import PuzzleGrid from "./components/PuzzleGrid";

export default function App() {
    const { username } = useAuth();

    const [sizex, setSizex] = useState(10);
    const [sizey, setSizey] = useState(10);
    const [difficulty, setDifficulty] = useState(5);

    const [game, setGame] = useState<Game | null >(null);
    const [sidenums, setSidenums] = useState<SideNums | null>(null);
    const [gameChanged, setGameChanged] = useState(false);
    
    useEffect(() => {
        getGame()
            .then((res) => {
                setGame(res);
            });
    }, [gameChanged])

    useEffect(() => {
        if (game != null) setSidenums(numberCount(game));
    }, [game])
    
    if (username == null) return <Login />;
    
    if (game == null || sidenums == null) {
        return (
            <main className="flex flex-1 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            </main>
        );
    }
    
    return (
        <main className="mx-auto flex w-full flex-1 flex-col sm:flex-row sm:items-stretch">
            <GameConfigs
                sizex={sizex} setSizex={setSizex} 
                sizey={sizey} setSizey={setSizey}
                difficulty={difficulty} setDifficulty={setDifficulty}
                onGenerateGame={() => {
                    setGame(null);
                    setGameDB(generateGame(sizex, sizey, difficulty / 10))
                        .then(() => { setGameChanged((c) => !c) })
                }} />
            <section className="flex flex-1 items-center justify-center overflow-auto py-2">
                <PuzzleGrid game={game} sidenums={sidenums} />
            </section>
        </main>
    )
}
