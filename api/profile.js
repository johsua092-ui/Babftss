import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyFirebaseToken(idToken) {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({ idToken, audience: process.env.FIREBASE_PROJECT_ID_SERVER });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub) throw new Error('Invalid token payload');
  return payload;
}

async function ensureProfile(supabase, firebaseUid, userInfo) {
  const { data: existing } = await supabase.from('profiles').select('*').eq('firebase_uid', firebaseUid).maybeSingle();
  if (existing) return existing;
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({ firebase_uid: firebaseUid, display_name: userInfo.name || userInfo.email?.split('@')[0] || null, avatar_url: userInfo.picture || null })
    .select().single();
  if (error) throw error;
  return newProfile;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const idToken = authHeader.split(' ')[1];
    const firebaseUser = await verifyFirebaseToken(idToken);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
      const profile = await ensureProfile(supabase, firebaseUser.sub, firebaseUser);
      return res.status(200).json(profile);
    }
    if (req.method === 'PATCH') {
      const { display_name, avatar_url } = req.body;
      const updates = {};
      if (display_name !== undefined) updates.display_name = display_name;
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;
      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
      const { data, error } = await supabase.from('profiles').update(updates).eq('firebase_uid', firebaseUser.sub).select().single();
      if (error) { console.error('Supabase update error:', error); return res.status(500).json({ error: 'Failed to update profile' }); }
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Profile error:', e);
    return res.status(401).json({ error: e.message || 'Unauthorized' });
  }
}