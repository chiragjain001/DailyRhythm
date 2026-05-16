const fs = require('fs');
const env = fs.readFileSync('e:/MindSync/.env', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

fetch(`${url}/rest/v1/wellness_completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation'
  },
  body: JSON.stringify({
    user_id: '00000000-0000-0000-0000-000000000000',
    wellness_id: '00000000-0000-0000-0000-000000000000',
    completion_date: '2026-05-16'
  })
}).then(res => res.json()).then(console.log).catch(console.error);
