// Database configuration and utilities
// Using Supabase for free PostgreSQL database

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Database features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Database schema for chat history
export const CHAT_TABLES = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  USERS: 'users'
};

// Initialize database tables (run this once during setup)
export async function initializeDatabase() {
  if (!supabase) {
    console.log('Supabase not configured - skipping database initialization');
    return;
  }

  try {
    // Create conversations table
    const { error: conversationsError } = await supabase.rpc('create_conversations_table');
    if (conversationsError && !conversationsError.message.includes('already exists')) {
      console.error('Error creating conversations table:', conversationsError);
    }

    // Create messages table
    const { error: messagesError } = await supabase.rpc('create_messages_table');
    if (messagesError && !messagesError.message.includes('already exists')) {
      console.error('Error creating messages table:', messagesError);
    }

    // Create users table
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError && !usersError.message.includes('already exists')) {
      console.error('Error creating users table:', usersError);
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Chat history functions
export async function saveConversation(conversationData) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(CHAT_TABLES.CONVERSATIONS)
      .insert([conversationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return null;
  }
}

export async function saveMessage(messageData) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(CHAT_TABLES.MESSAGES)
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
}

export async function getConversationHistory(conversationId) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from(CHAT_TABLES.MESSAGES)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
}

export async function getUserConversations(userId) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from(CHAT_TABLES.CONVERSATIONS)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return [];
  }
}

// User management functions
export async function createUser(userData) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(CHAT_TABLES.USERS)
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function getUserById(userId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from(CHAT_TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}