import { supabase } from './supabase';
import type { CategoryDef, Prefs, Task } from '../types';

/** The slice of app state we persist to the cloud (one JSON row per user). */
export interface CloudState {
  name: string;
  prefs: Prefs;
  tasks: Task[];
  startMin: number;
  categories?: CategoryDef[];
}

export interface CloudUser {
  id: string;
  email: string;
}

export async function signUp(
  email: string,
  password: string,
  initial: CloudState,
): Promise<CloudUser> {
  if (!supabase) throw new Error('Cloud not configured');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('Check your email to confirm your account, then log in.');
  await push(user.id, initial);
  return { id: user.id, email: user.email ?? email };
}

export async function signIn(email: string, password: string): Promise<CloudUser> {
  if (!supabase) throw new Error('Cloud not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { id: data.user.id, email: data.user.email ?? email };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<CloudUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

/** Pull the user's saved state, or null if they have no row yet. */
export async function pull(userId: string): Promise<CloudState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('state')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.state as CloudState) ?? null;
}

/** Upsert the user's full state (single-row sync — simple and reliable). */
export async function push(userId: string, state: CloudState): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Subscribe to auth state changes (login in another tab, token refresh, sign out). */
export function onAuthChange(cb: (user: CloudUser | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
  });
  return () => data.subscription.unsubscribe();
}
