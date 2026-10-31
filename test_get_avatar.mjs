// test_get_avatar.mjs — Test suite untuk /api/get-avatar
import handler from './api/get-avatar.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log('  PASS ', msg);
    passed++;
  } else {
    console.error('  FAIL ', msg);
    failed++;
  }
}

async function mockReq(query, method = 'GET') {
  const req = {
    method,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    query
  };
  let statusCode = 200;
  let headers = {};
  let body = null;
  const res = {
    setHeader(k, v) { headers[k] = v; },
    status(code) { statusCode = code; return res; },
    json(data) { body = data; return res; },
    end() { return res; }
  };
  await handler(req, res);
  return { statusCode, headers, body };
}

console.log('=== TEST SUITE: /api/get-avatar ===');

// 1. Missing username
{
  const r = await mockReq({});
  assert(r.statusCode === 400, 'Missing username returns 400');
  assert(r.body && r.body.error, 'Returns error message');
  assert(r.headers['Access-Control-Allow-Origin'] === '*', 'CORS Allow-Origin * set');
}

// 2. Invalid username length (< 3)
{
  const r = await mockReq({ username: 'ab' });
  assert(r.statusCode === 400, 'Username < 3 chars returns 400');
}

// 3. Invalid username characters
{
  const r = await mockReq({ username: 'user!@#' });
  assert(r.statusCode === 400, 'Username with invalid symbols returns 400');
}

// 4. Non-existent username
{
  const r = await mockReq({ username: 'user_tidak_ada_98765' });
  assert(r.statusCode === 404, 'Non-existent Roblox username returns 404');
  assert(r.body.error.includes('tidak ditemukan'), '404 contains informative message');
}

// 5. Valid username lookup (@Roblox)
{
  const r = await mockReq({ username: '@Roblox' });
  // Without ROBLOX_API_KEY, Roblox returns 403. With ROBLOX_API_KEY, returns 200.
  // Both are expected and handled cleanly.
  assert(r.statusCode === 403 || r.statusCode === 200, 'Valid user query reaches Roblox API cleanly (HTTP ' + r.statusCode + ')');
  if (r.statusCode === 403) {
    assert(r.body.code === 'ROBLOX_AUTH_REQUIRED', 'Gracefully informs ROBLOX_AUTH_REQUIRED');
  }
}

console.log(`\nRESULT: ${passed} PASS / ${failed} FAIL\n`);
if (failed > 0) process.exit(1);
