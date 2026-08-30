// api/ai-helper-v2.js — Backend proxy for AI Helper v2 (BlockSimulator3Dv2)
// Purpose: hide API credentials from frontend by proxying requests through backend
// 
// Environment variables required (server-side only, NO VITE_ prefix):
//   AI_HELPER_V2_URL  — Railway API endpoint (e.g. https://qwengates-production-78bc.up.railway.app/v1)
//   AI_HELPER_V2_KEY  — API key for the Railway endpoint
//
// This handler is registered in server/index.js at /api/ai-helper-v2

const AI_HELPER_V2_URL = process.env.AI_HELPER_V2_URL;
const AI_HELPER_V2_KEY = process.env.AI_HELPER_V2_KEY;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if credentials are configured
  if (!AI_HELPER_V2_URL || !AI_HELPER_V2_KEY) {
    console.error('[ai-helper-v2] Missing environment variables: AI_HELPER_V2_URL or AI_HELPER_V2_KEY');
    return res.status(503).json({ 
      error: 'AI Helper service not configured. Please contact admin.' 
    });
  }

  try {
    // Extract messages and model from request body
    const { messages, model = 'qwen-3.7', temperature = 0.7, max_tokens = 1000 } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array required' });
    }

    // Forward request to Railway API
    const response = await fetch(AI_HELPER_V2_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AI_HELPER_V2_KEY,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ai-helper-v2] Upstream API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'AI service error: ' + response.status 
      });
    }

    const data = await response.json();
    
    // Return the response to frontend
    return res.status(200).json(data);

  } catch (err) {
    console.error('[ai-helper-v2] Proxy error:', err.message);
    return res.status(502).json({ 
      error: 'Failed to connect to AI service: ' + err.message 
    });
  }
}
