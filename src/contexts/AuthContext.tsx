'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => ({}),
    signUp: async () => ({}),
    signOut: async () => { },
    resetPassword: async () => ({}),
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const supabase = getSupabaseClient();
        if (!supabase) return { error: 'Supabase not configured' };

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { error: error.message };
        return {};
    };

    const signUp = async (email: string, password: string) => {
        const supabase = getSupabaseClient();
        if (!supabase) return { error: 'Supabase not configured' };

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) return { error: error.message };
        return {};
    };

    const signOut = async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
        const supabase = getSupabaseClient();
        if (!supabase) return { error: 'Supabase not configured' };

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) return { error: error.message };
        return {};
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}
