import { createClient } from '@supabase/supabase-js'

// Use your .env values (set these manually from your Supabase dashboard)
const supabaseUrl = 'https://porrgkjoelfjfjcoobqk.supabase.co' // Replace with YOUR VITE_SUPABASE_URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcnJna2pvZWxmamZqY29vYnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA1MjgsImV4cCI6MjA4MDk3NjUyOH0.2iA7XmcWYdtO5j2F89eY4F4Z6sMNuCUZh8NtzFQDz2o'// Replace with VITE_SUPABASE_ANON_KEY or service_role
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🔄 Creating credential_types table...')
  console.log('📍 Using Supabase:', supabaseUrl)

  try {
    // Create table and RLS
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.credential_types (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        DO \$\$
        BEGIN
          EXECUTE 'ALTER TABLE IF EXISTS public.credential_types ENABLE ROW LEVEL SECURITY';
          
          EXECUTE 'DROP POLICY IF EXISTS "Users can manage credential types" ON public.credential_types';
          EXECUTE 'CREATE POLICY "Enable all for authenticated users" 
            ON public.credential_types FOR ALL 
            TO authenticated USING (true) WITH CHECK (true)';
            
          CREATE INDEX IF NOT EXISTS idx_credential_types_name ON public.credential_types(name);
        END \$\$;
      `
    })

    if (createError) {
      console.error('⚠️ SQL execution warning:', createError.message)
    }

    // Seed common types
    const commonTypes = [
      'CT PE License',
      'OH PE License', 
      'SBE',
      'PA PE License',
      'NJ BRC Business'
    ]

    const { data: existingTypes } = await supabase
      .from('credential_types')
      .select('name')

    const existingNames = new Set(existingTypes?.map(t => t.name) || [])
    
    for (const type of commonTypes.filter(t => !existingNames.has(t))) {
      const { error } = await supabase
        .from('credential_types')
        .insert({ name: type })

      if (error) {
        console.warn(`⚠️ Could not insert ${type}:`, error.message)
      } else {
        console.log(`✅ Added type: ${type}`)
      }
    }

    // Verify
    const { data: allTypes } = await supabase
      .from('credential_types')
      .select('*')
      .order('name')

    console.log('✅ Table ready! Types:', allTypes?.map(t => t.name) || [])
    console.log('🎉 Migration complete! Ready for service updates.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
