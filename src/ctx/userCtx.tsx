'use client';

/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from 'react';
import { getUserLives, submitUsername } from '../lib/supabase';

export const MAX_LIVES = 5;

interface UserCtxProps {
    username: string | null;
    login: (inputusername: string) => void;
    logout: () => void;
    lives: number;
    syncLives: (value: number) => void;
    resetLives: () => void;
    openConfig: boolean;
    toggleOpenConfig: () => void;
}

const AuthContext = createContext<UserCtxProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Restore the saved session during the first render (lazy initializer)
    // instead of setting state from an effect.
    const [username, setUsername] = useState<string | null>(
        () => localStorage.getItem('username')
    );
    const [lives, setLives] = useState(MAX_LIVES);
    const [openConfig, setOpenConfig] = useState<boolean>(
        () => localStorage.getItem('menuConfig') !== "false"
    );

    // Make sure restored sessions (and newly logged-in ones) still have a row
    // in `players`, then hydrate lives from the database. Lives are never
    // written from the client; `play_turn` and `reset_game` own them.
    useEffect(() => {
        if (username == null) return;

        let cancelled = false;

        (async () => {
            await submitUsername(username);
            const stored = await getUserLives(username);
            if (!cancelled) setLives(stored);
        })().catch((error) => console.error('Could not load lives', error));

        return () => {
            cancelled = true;
        };
    }, [username]);

    const login = useCallback((inputUsername: string) => {
        const next = inputUsername.trim();
        localStorage.setItem('username', next);
        setUsername(next);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('username');
        setUsername(null);
    }, []);

    const syncLives = useCallback((value: number) => setLives(value), []);

    const resetLives = useCallback(() => setLives(MAX_LIVES), []);

    const toggleOpenConfig = useCallback(() => {
        setOpenConfig((open) => {
            localStorage.setItem('menuConfig', open ? "false" : "true");
            return !open;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ username, login, logout, lives, syncLives, resetLives, openConfig, toggleOpenConfig }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
