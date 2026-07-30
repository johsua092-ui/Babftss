import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('leaderboard').select('*').limit(50);
    if (error) { console.error('Supabase leaderboard error:', error); return res.status(500).json({ error: 'Failed to fetch leaderboard' }); }
    const ranked = (data || []).map((entry, i) => ({ rank: i + 1, ...entry }));
    return res.status(200).json(ranked);
  } catch (e) {
    console.error('Leaderboard error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}