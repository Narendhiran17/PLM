import https from 'https';
import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('.catalyst_mcp_token.json', 'utf8'));
const url = 'https://catalyst-tools-925178529.zohomcp.com/mcp/a59915586695f1b03f738cc2a74642ad/message';

const payload = JSON.stringify({
  jsonrpc: '2.0',
  id: 4,
  method: 'tools/call',
  params: {
    name: 'CatalystbyZoho_List_All_Tables',
    arguments: {
      path_variables: {
        projectId: '37343000000549013'
      },
      headers: {
        'Catalyst-org': 899085195,
        'Environment': 'Development'
      }
    }
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
    console.log('Status:', res.statusCode);
    console.log('Tables Result:', data);
  });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
