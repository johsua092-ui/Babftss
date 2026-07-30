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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const idToken = authHeader.split(' ')[1];
    const firebaseUser = await verifyFirebaseToken(idToken);
    const firebaseUid = firebaseUser.sub;
    const { topic, score, answers } = req.body;
    if (!topic || score === undefined) {
      return res.status(400).json({ error: 'topic and score are required' });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('quiz_results')
      .insert({ firebase_uid: firebaseUid, topic, score, answers: answers || {} })
      .select().single();
    if (error) { console.error('Supabase insert error:', error); return res.status(500).json({ error: 'Failed to save quiz result' }); }
    return res.status(200).json({ success: true, result: data });
  } catch (e) {
    console.error('Quiz submit error:', e);
    return res.status(401).json({ error: e.message || 'Unauthorized' });
  }
}