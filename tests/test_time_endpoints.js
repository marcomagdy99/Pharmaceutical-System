const https = require('https');

// Test 1: Fetch from Cloudflare trace
function testCloudflare() {
  return new Promise((resolve) => {
    const req = https.get('https://cloudflare.com/cdn-cgi/trace', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/ts=([0-9.]+)/);
        if (match) {
          const ts = Math.floor(parseFloat(match[1]) * 1000);
          console.log('✅ Cloudflare trace success! Timestamp:', ts, 'Date:', new Date(ts).toISOString());
          resolve(true);
        } else {
          console.log('❌ Cloudflare returned data but no ts match:', data);
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.log('❌ Cloudflare error:', err.message);
      resolve(false);
    });
  });
}

// Test 2: Fetch HEAD Date from worldtimeapi or public web
function testHeadRequest() {
  return new Promise((resolve) => {
    const req = https.request('https://pharmacare-ab4b6.web.app', { method: 'HEAD', timeout: 3000 }, (res) => {
      const dateHeader = res.headers['date'];
      console.log('✅ Origin HEAD Date header:', dateHeader, 'Parsed:', new Date(dateHeader).toISOString());
      resolve(true);
    });
    req.on('error', (err) => {
      console.log('❌ Origin error:', err.message);
      resolve(false);
    });
    req.end();
  });
}

async function run() {
  console.log('Testing dual server time endpoints...');
  await testHeadRequest();
  await testCloudflare();
}

run();
