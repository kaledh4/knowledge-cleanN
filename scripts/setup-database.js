import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLSPolicies() {
  console.log('Setting up RLS policies for knowledge_entries table...');

  const policies = [
    // Enable RLS
    `ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;`,
    
    // Drop existing policies if they exist
    `DROP POLICY IF EXISTS "Users can view their own knowledge entries" ON knowledge_entries;`,
    `DROP POLICY IF EXISTS "Users can create their own knowledge entries" ON knowledge_entries;`,
    `DROP POLICY IF EXISTS "Users can update their own knowledge entries" ON knowledge_entries;`,
    `DROP POLICY IF EXISTS "Users can delete their own knowledge entries" ON knowledge_entries;`,
    
    // Create new policies
    `CREATE POLICY "Users can view their own knowledge entries"
     ON knowledge_entries
     FOR SELECT
     TO authenticated
     USING (user_id = auth.uid());`,
    
    `CREATE POLICY "Users can create their own knowledge entries"
     ON knowledge_entries
     FOR INSERT
     TO authenticated
     WITH CHECK (user_id = auth.uid());`,
    
    `CREATE POLICY "Users can update their own knowledge entries"
     ON knowledge_entries
     FOR UPDATE
     TO authenticated
     USING (user_id = auth.uid())
     WITH CHECK (user_id = auth.uid());`,
    
    `CREATE POLICY "Users can delete their own knowledge entries"
     ON knowledge_entries
     FOR DELETE
     TO authenticated
     USING (user_id = auth.uid());`
  ];

  for (const policy of policies) {
    try {
      console.log('Executing:', policy.split('\n')[0] + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      
      if (error) {
        console.error('Error executing policy:', error);
        // Continue with other policies even if one fails
      } else {
        console.log('✓ Policy executed successfully');
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  console.log('RLS policies setup completed!');
}

// Alternative method using direct SQL execution
async function setupRLSPoliciesDirectSQL() {
  console.log('Setting up RLS policies using direct SQL execution...');

  const sqlCommands = `
    -- Enable RLS on knowledge_entries table
    ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own knowledge entries" ON knowledge_entries;
    DROP POLICY IF EXISTS "Users can create their own knowledge entries" ON knowledge_entries;
    DROP POLICY IF EXISTS "Users can update their own knowledge entries" ON knowledge_entries;
    DROP POLICY IF EXISTS "Users can delete their own knowledge entries" ON knowledge_entries;

    -- Policy to allow authenticated users to select their own knowledge entries
    CREATE POLICY "Users can view their own knowledge entries"
    ON knowledge_entries
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

    -- Policy to allow authenticated users to insert their own knowledge entries
    CREATE POLICY "Users can create their own knowledge entries"
    ON knowledge_entries
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

    -- Policy to allow authenticated users to update their own knowledge entries
    CREATE POLICY "Users can update their own knowledge entries"
    ON knowledge_entries
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

    -- Policy to allow authenticated users to delete their own knowledge entries
    CREATE POLICY "Users can delete their own knowledge entries"
    ON knowledge_entries
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
  `;

  try {
    // Use the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: sqlCommands })
    });

    if (response.ok) {
      console.log('✓ RLS policies setup completed successfully!');
    } else {
      const error = await response.text();
      console.error('Error setting up RLS policies:', error);
      
      // Fallback: Print the SQL for manual execution
      console.log('\n=== MANUAL SETUP REQUIRED ===');
      console.log('Please execute the following SQL in your Supabase dashboard:');
      console.log(sqlCommands);
    }
  } catch (error) {
    console.error('Error:', error.message);
    
    // Fallback: Print the SQL for manual execution
    console.log('\n=== MANUAL SETUP REQUIRED ===');
    console.log('Please execute the following SQL in your Supabase dashboard:');
    console.log(sqlCommands);
  }
}

// Run the setup
setupRLSPoliciesDirectSQL()
  .then(() => {
    console.log('Database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });

export { setupRLSPolicies, setupRLSPoliciesDirectSQL };