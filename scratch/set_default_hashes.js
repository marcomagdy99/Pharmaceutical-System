const https = require('https');
const crypto = require('crypto');

const defaultPasswordMap = {
  'admin@pharmacare.com': 'admin123',
  'bu@pharmacare.com': 'bu123',
  'lm@pharmacare.com': 'lm123',
  'lm2@pharmacare.com': 'lm123',
  'dm@pharmacare.com': 'dm123',
  'dm2@pharmacare.com': 'dm123',
  'dm3@pharmacare.com': 'dm123',
  'rep@pharmacare.com': 'rep123',
  'rep2@pharmacare.com': 'rep123',
  'rep3@pharmacare.com': 'rep123',
  'rep4@pharmacare.com': 'rep123',
  'rep5@pharmacare.com': 'rep123',
  'pm@pharmacare.com': 'pm123',
  'pm2@pharmacare.com': '123456',
  'hr@pharmacare.com': 'hr123'
};

https.get('https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const master = JSON.parse(json.fields.payload.stringValue);

      master.users.forEach(u => {
        const email = (u.email || '').toLowerCase().trim();
        if (!u.passwordHash) {
          const pass = defaultPasswordMap[email] || '123456';
          u.passwordHash = crypto.createHash('sha256').update(pass).digest('hex');
          console.log(`Setting passwordHash for ${u.name} (${email}) to hash of '${pass}': ${u.passwordHash}`);
        }
      });

      const newPayload = JSON.stringify(master);
      const updateData = JSON.stringify({
        fields: {
          payload: { stringValue: newPayload },
          updatedAtMs: { integerValue: String(Date.now()) },
          updatedBy: { stringValue: 'system_passwords_fix' }
        }
      });

      const patchReq = https.request('https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data?updateMask.fieldPaths=payload&updateMask.fieldPaths=updatedAtMs&updateMask.fieldPaths=updatedBy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(updateData)
        }
      }, (patchRes) => {
        let pData = '';
        patchRes.on('data', chunk => pData += chunk);
        patchRes.on('end', () => {
          console.log('Patch status:', patchRes.statusCode);
          if (patchRes.statusCode === 200) {
            console.log('SUCCESSFULLY SAVED PASSWORD HASHES TO CLOUD FIRESTORE!');
          }
        });
      });

      patchReq.write(updateData);
      patchReq.end();
    } catch (e) {
      console.error('Error:', e);
    }
  });
});
