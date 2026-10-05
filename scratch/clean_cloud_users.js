const https = require('https');

// 1. Fetch current master_data
https.get('https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const master = JSON.parse(json.fields.payload.stringValue);

      console.log('Current users count:', master.users.length);

      // Deduplicate and heal users
      const seenEmails = new Set();
      const seenIds = new Set();
      const cleanUsers = [];

      master.users.forEach((u) => {
        // If Mohamed Ramadan has id "pm2", fix to "rep5"
        if (u.name === 'Mohamed Ramadan' || u.email === 'rep5@pharmacare.com') {
          u.id = 'rep5';
          u.email = 'rep5@pharmacare.com';
          u.employeeCode = 'EMP-005';
          u.code = 'EMP-005';
        }
        // If Fady Adel has id "u1790626731729", fix to "pm2"
        if (u.email === 'pm2@pharmacare.com') {
          u.id = 'pm2';
          u.role = 'product_manager';
          u.employeeCode = 'PM-002';
          u.code = 'PM-002';
        }

        const email = (u.email || '').toLowerCase().trim();
        const id = u.id;

        if (email && seenEmails.has(email)) {
          console.log('Dropping duplicate email user:', u.name, email, id);
          return;
        }
        if (id && seenIds.has(id)) {
          console.log('Dropping duplicate id user:', u.name, email, id);
          return;
        }

        if (email) seenEmails.add(email);
        if (id) seenIds.add(id);
        cleanUsers.push(u);
      });

      console.log('Clean users count:', cleanUsers.length);

      // Fix areas repId for Dokki & Haram to "rep5"
      if (Array.isArray(master.areas)) {
        master.areas.forEach(a => {
          if (a.repId === 'pm2') {
            console.log('Fixing area repId for', a.name, 'from pm2 to rep5');
            a.repId = 'rep5';
          }
        });
      }

      master.users = cleanUsers;

      const newPayload = JSON.stringify(master);

      const updateData = JSON.stringify({
        fields: {
          payload: { stringValue: newPayload },
          updatedAtMs: { integerValue: String(Date.now()) },
          updatedBy: { stringValue: 'system_cleanup' }
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
            console.log('SUCCESSFULLY CLEANED CLOUD FIRESTORE MASTER DATA!');
          } else {
            console.log('Patch response:', pData);
          }
        });
      });

      patchReq.on('error', (err) => console.error('Patch error:', err));
      patchReq.write(updateData);
      patchReq.end();

    } catch (e) {
      console.error('Error:', e);
    }
  });
}).on('error', err => console.error('Fetch error:', err));
