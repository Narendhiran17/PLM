import https from 'https';
import fs from 'fs';

const tokenData = JSON.parse(fs.readFileSync('.catalyst_mcp_token.json', 'utf8'));
const url = 'https://catalyst-tools-925178529.zohomcp.com/mcp/a59915586695f1b03f738cc2a74642ad/message';

const payload = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
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
    try {
      const parsed = JSON.parse(data);
      console.log('Total tools returned:', parsed.result?.tools?.length);
      const tableTools = parsed.result?.tools?.filter(t => t.name.includes('Table') || t.name.includes('Column') || t.name.includes('Row') || t.name.includes('Datastore'));
      console.log('Relevant tools:', tableTools?.map(t => t.name));
    } catch (e) {
      console.log('Body:', data.slice(0, 500));
    }
  });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
