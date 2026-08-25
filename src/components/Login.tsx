import { useState } from "react";
import { useAuth } from "../ctx/userCtx";
import { submitUsername } from "../lib/supabase";

export default function Login() {
    const { login } = useAuth();

    const [input, setInput] = useState<string>("");

    function handleLogin(e: React.SubmitEvent) {
        e.preventDefault();

        if (input == "") return;
        
        submitUsername(input).then((existed) => {
            if (existed) console.log("existed");
            else console.log("not existed");
        })
        login(input);
    }

    return (
        <main className="flex flex-1 items-center justify-center px-4">
            <form onSubmit={(e) => handleLogin(e)} className="w-full max-w-sm rounded-2xl border border-border bg-bg p-8 shadow-[var(--shadow)]">
                <h1 className="mb-1 text-lg font-semibold text-text-h">Nonograma Online</h1>
                <p className="mb-6 text-sm text-text">Enter a username to start playing.</p>
                
                <label htmlFor="username" className="mb-1.5 block text-sm text-text">
                    Username
                </label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. pixel_painter"
                    className="mb-5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-h outline-none transition-colors focus:border-accent-border"
                />

                <button
                    type="submit"
                    className="w-full cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
                >Login</button>
            </form>
        </main>
    );
}