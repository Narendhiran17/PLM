import https from 'https';
import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('.catalyst_mcp_token.json', 'utf8'));
const url = 'https://catalyst-tools-925178529.zohomcp.com/mcp/a59915586695f1b03f738cc2a74642ad/message';

function callMcp(name, args) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    });

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Creating PartMaster table...');
  const res = await callMcp('CatalystbyZoho_Create_Table', {
    path_variables: {
      projectId: '37343000000549013'
    },
    headers: {
      'Catalyst-org': 899085195,
      'Environment': 'Development'
    },
    body: {
      table_name: 'PartMaster',
      table_scope: 'GLOBAL'
    }
  });

  console.log('Result:', JSON.stringify(res, null, 2));
}

run();
