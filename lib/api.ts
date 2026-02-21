import { supabase } from './supabase';
import { Person, ChatMessage } from '../types';

// ─── AUTH ─────────────────────────────────────────────

export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export function onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
}

export async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

// ─── PEOPLE ───────────────────────────────────────────

export async function fetchPeople(): Promise<Person[]> {
    const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        ring: row.ring,
        group: row.group,
        supportTypes: row.support_types || [],
        lastInteraction: row.last_interaction,
        notes: row.notes,
    }));
}

export async function addPerson(person: Person): Promise<Person> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('people')
        .insert({
            id: person.id.length > 20 ? undefined : undefined, // let DB generate UUID
            user_id: session.user.id,
            name: person.name,
            ring: person.ring,
            group: person.group,
            support_types: person.supportTypes,
            last_interaction: person.lastInteraction,
            notes: person.notes,
        })
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        name: data.name,
        ring: data.ring,
        group: data.group,
        supportTypes: data.support_types || [],
        lastInteraction: data.last_interaction,
        notes: data.notes,
    };
}

export async function updatePerson(person: Person): Promise<void> {
    const { error } = await supabase
        .from('people')
        .update({
            name: person.name,
            ring: person.ring,
            group: person.group,
            support_types: person.supportTypes,
            last_interaction: person.lastInteraction,
            notes: person.notes,
        })
        .eq('id', person.id);
    if (error) throw error;
}

export async function deletePerson(id: string): Promise<void> {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) throw error;
}

export async function deleteAllPeople(): Promise<void> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase
        .from('people')
        .delete()
        .eq('user_id', session.user.id);
    if (error) throw error;
}

// ─── MESSAGES ─────────────────────────────────────────

export async function fetchMessages(): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('timestamp', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
        id: row.id,
        sender: row.sender as 'user' | 'ai',
        text: row.text,
        timestamp: Number(row.timestamp),
    }));
}

export async function addMessage(msg: ChatMessage): Promise<ChatMessage> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            user_id: session.user.id,
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp,
        })
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        sender: data.sender as 'user' | 'ai',
        text: data.text,
        timestamp: Number(data.timestamp),
    };
}

export async function clearMessages(): Promise<void> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', session.user.id);
    if (error) throw error;
}

// ─── USER STATE ───────────────────────────────────────

export interface UserState {
    e_user: number;
    ai_session_count: number;
    real_event_count: number;
    onboarding_complete: boolean;
    settings: {
        highlightNames: boolean;
        confirmBeforeAdd: boolean;
        showSupportStats: boolean;
        showInteractionMarkers: boolean;
    };
}

const DEFAULT_STATE: UserState = {
    e_user: 65,
    ai_session_count: 0,
    real_event_count: 0,
    onboarding_complete: false,
    settings: {
        highlightNames: true,
        confirmBeforeAdd: true,
        showSupportStats: true,
        showInteractionMarkers: true,
    },
};

export async function fetchOrCreateUserState(): Promise<UserState> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');

    // Try to fetch existing
    const { data, error } = await supabase
        .from('user_state')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
    if (error) throw error;

    if (data) {
        return {
            e_user: data.e_user,
            ai_session_count: data.ai_session_count,
            real_event_count: data.real_event_count,
            onboarding_complete: data.onboarding_complete,
            settings: data.settings as UserState['settings'],
        };
    }

    // Create new state
    const { data: newData, error: insertError } = await supabase
        .from('user_state')
        .insert({
            user_id: session.user.id,
            ...DEFAULT_STATE,
        })
        .select()
        .single();
    if (insertError) throw insertError;
    return {
        e_user: newData.e_user,
        ai_session_count: newData.ai_session_count,
        real_event_count: newData.real_event_count,
        onboarding_complete: newData.onboarding_complete,
        settings: newData.settings as UserState['settings'],
    };
}

export async function updateUserState(partial: Partial<UserState>): Promise<void> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase
        .from('user_state')
        .update({ ...partial, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
    if (error) throw error;
}

export async function resetUserState(): Promise<void> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase
        .from('user_state')
        .update({ ...DEFAULT_STATE, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id);
    if (error) throw error;
}

// ─── FEEDBACK ─────────────────────────────────────────

export async function submitFeedback(text: string): Promise<void> {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase
        .from('feedback')
        .insert({ user_id: session.user.id, text });
    if (error) throw error;
}
