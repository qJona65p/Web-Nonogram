import Login from "./components/Login";
import { useAuth } from "./ctx/userCtx";
import { useEffect, useState } from "react";
import { getPlayerGame } from "./lib/supabase";
import GameConfigs from "./components/GameConfigs";
import PuzzleGrid from "./components/PuzzleGrid";
import { useGame } from "./ctx/gameCtx";

export default function App() {
    const { username } = useAuth();
    const { game, gameChanged } = useGame();

    const [playerGame, setPlayerGame] = useState<(boolean | null)[][] | null>();

    useEffect(() => setPlayerGame(null), [gameChanged]);

    useEffect(() => {
        if (game != null && username != null) {
            // load moves from player
            getPlayerGame(username, game.sizex, game.sizey)
                .then((res) => {
                    setPlayerGame(res);
                });
        }
    }, [game])
    
    if (username == null) return <Login />;
    
    if (game == null || playerGame == null) {
        return (
            <main className="flex flex-1 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            </main>
        );
    }
    
    return (
        <main className="mx-auto flex w-full flex-1 flex-col sm:flex-row sm:items-stretch">
            <GameConfigs />
            <section className="flex flex-1 items-center justify-center overflow-auto py-2">
                <PuzzleGrid playerGame={playerGame} />
            </section>
        </main>
    )
}
