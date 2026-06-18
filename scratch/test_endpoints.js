const https = require('https');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  // Login to get token first
  console.log('Logging in to backend-admin-qe72...');
  try {
    const loginRes = await request('https://backend-admin-qe72.onrender.com/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    // Can't test easily without credentials
    console.log(loginRes);
  } catch (e) {
    console.error(e);
  }
})();
