#!/usr/bin/env node

/**
 * Database Setup Script
 * Sets up Supabase database with required tables for chat history
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  console.error('   Please add them to your .env file');
  console.log('\n📝 To get these values:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Create a new project');
  console.log('   3. Go to Settings > API');
  console.log('   4. Copy the Project URL and service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🚀 Setting up Supabase database tables...');

  try {
    // Create users table
    console.log('📋 Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own profile" ON users
          FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" ON users
          FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Users can insert own profile" ON users
          FOR INSERT WITH CHECK (auth.uid() = id);
      `
    });

    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create conversations table
    console.log('📋 Creating conversations table...');
    const { error: conversationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own conversations" ON conversations
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can create conversations" ON conversations
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own conversations" ON conversations
          FOR UPDATE USING (auth.uid() = user_id);
      `
    });

    if (conversationsError) {
      console.error('Error creating conversations table:', conversationsError);
    } else {
      console.log('✅ Conversations table created successfully');
    }

    // Create messages table
    console.log('📋 Creating messages table...');
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view messages in own conversations" ON messages
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM conversations
              WHERE conversations.id = messages.conversation_id
              AND conversations.user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can insert messages in own conversations" ON messages
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM conversations
              WHERE conversations.id = messages.conversation_id
              AND conversations.user_id = auth.uid()
            )
          );
      `
    });

    if (messagesError) {
      console.error('Error creating messages table:', messagesError);
    } else {
      console.log('✅ Messages table created successfully');
    }

    // Create updated_at trigger function
    console.log('📋 Setting up updated_at triggers...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
        CREATE TRIGGER update_conversations_updated_at
          BEFORE UPDATE ON conversations
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (triggerError) {
      console.error('Error creating triggers:', triggerError);
    } else {
      console.log('✅ Database triggers created successfully');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Enable authentication in your Supabase dashboard');
    console.log('   2. Set up Google OAuth provider if needed');
    console.log('   3. Add the following to your .env file:');
    console.log(`      NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
    console.log(`      NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`);
    console.log('   4. Test the database integration');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function checkConnection() {
  console.log('🔍 Testing Supabase connection...');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      throw error;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Chatbot Database Setup');
  console.log('========================');

  const isConnected = await checkConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to Supabase. Please check your configuration.');
    process.exit(1);
  }

  await createTables();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTables, checkConnection };