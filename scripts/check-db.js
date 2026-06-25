import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fkysadvfvncjfdhjijoy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreXNhZHZmdm5jamZkaGppam95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NjkxODcsImV4cCI6MjA5NzU0NTE4N30._RbRIeraO2hGJemrJEh4vJ2E0Fhsu3fMk-dvh5tqJmc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles currently in DB:', data?.length);
  if (data?.length > 0) {
    console.log('First profile username:', data[0].username);
  }
}

check();
