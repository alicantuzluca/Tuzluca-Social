import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fkysadvfvncjfdhjijoy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreXNhZHZmdm5jamZkaGppam95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NjkxODcsImV4cCI6MjA5NzU0NTE4N30._RbRIeraO2hGJemrJEh4vJ2E0Fhsu3fMk-dvh5tqJmc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function wipe() {
  console.log('Wiping messages...');
  await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Wiping contacts...');
  await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Wiping profiles...');
  const { error } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error('Error wiping profiles. RLS might be active:', error);
  } else {
    console.log('Database wiped successfully!');
  }
}

wipe();
