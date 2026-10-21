import http from 'http';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import { exec } from 'child_process';

const clientId = '1000.74OGCXOVDQ7CEELAD7VUSDCCDS433P';
const redirectUri = 'http://localhost:8080/callback';
const authEndpoint = 'https://mcp.zoho.com/mcp-client/8b87d5c90521da61457031fa122a0770/73682000000022001/oauth';
const tokenEndpoint = 'https://mcp.zoho.com/baas/mcp/v1/oauth/8b87d5c90521da61457031fa122a0770/73682000000022001/token';
const mcpMessageUrl = 'https://catalyst-tools-925178529.zohomcp.com/mcp/a59915586695f1b03f738cc2a74642ad/message';

// PKCE
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

const authUrl = `${authEndpoint}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${challenge}&code_challenge_method=S256&scope=ZohoMCP.tool.execute`;

console.log('\n======================================================');
console.log('AUTHORIZATION URL:');
console.log(authUrl);
console.log('======================================================\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>OAuth Error</h1><p>${error}</p>`);
      console.error('OAuth Error:', error);
      server.close();
      return;
    }

    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<h1>Authentication Successful!</h1><p>You can close this tab now. The MCP Datastore creator is processing...</p>`);
      console.log('Received auth code! Exchanging for token...');
      server.close();

      await exchangeToken(code);
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8080, () => {
  console.log('Waiting for OAuth callback on http://localhost:8080/callback ...');
});

async function exchangeToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code: code,
    redirect_uri: redirectUri,
    code_verifier: verifier
  }).toString();

  const req = https.request(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Token response status:', res.statusCode);
      try {
        const tokenData = JSON.parse(data);
        console.log('Token data received! Has access_token:', !!tokenData.access_token);
        fs.writeFileSync('.catalyst_mcp_token.json', JSON.stringify(tokenData, null, 2));
      } catch (e) {
        console.error('Failed to parse token response:', data);
      }
    });
  });

  req.on('error', e => console.error('Token exchange error:', e));
  req.write(body);
  req.end();
}
