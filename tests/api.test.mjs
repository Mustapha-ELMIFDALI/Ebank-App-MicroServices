// End-to-end test of the services, MCP and the agent: node tests/api.test.mjs
// It creates a user, a customer and an account: the last two disappear at the next restart.
import { GATEWAY, PORTS } from './config.mjs';
const G = GATEWAY;
const plainFetch = globalThis.fetch;
let bearer;
globalThis.fetch = (url, init = {}) => plainFetch(url, String(url).startsWith(G) && bearer ? { ...init, headers: { ...init.headers, authorization: bearer } } : init);
{
  const id = Math.random().toString(36).slice(2);
  const r = await plainFetch(G + '/AUTH-SERVICE/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'E2E', email: id + '@example.com', password: crypto.randomUUID() }) });
  bearer = 'Bearer ' + (await r.json()).token;
}
let pass = 0, fail = 0;
const ok = (name, value, extra = '') => { value ? pass++ : fail++; console.log(`${value ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const req = async (url, body) => {
  const r = await fetch(url, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { s: r.status, j, h: r.headers };
};

for (let i = 0; i < 90; i++) { try { if ((await fetch(`http://localhost:${PORTS.bot}/actuator/health`)).ok) break; } catch {} await sleep(1000); }
for (let i = 0; i < 30; i++) { if ((await req(G + '/EBANK-BOT/actuator/health')).s === 200) break; await sleep(1000); }

const list = await req(G + '/EBANK-SERVICE/accounts');
ok('15+ seeded accounts', list.j.length >= 15, list.j.length);
const one = await req(`${G}/EBANK-SERVICE/accounts/${list.j[0].id}`);
ok('Feign fills owner', one.j.customer?.name === 'Mohammed', JSON.stringify(one.j.customer));
ok('filter by customer', (await req(G + '/EBANK-SERVICE/accounts?customerId=2')).j.every(a => a.customerId === 2));
ok('missing account 404', (await req(G + '/EBANK-SERVICE/accounts/nope')).s === 404);
ok('unknown owner 422', (await req(G + '/EBANK-SERVICE/accounts', { balance: 10, type: 'SAVING_ACCOUNT', customerId: 99 })).s === 422);
ok('negative balance 400', (await req(G + '/EBANK-SERVICE/accounts', { balance: -1, type: 'SAVING_ACCOUNT', customerId: 1 })).s === 400);
ok('bad type 400', (await req(G + '/EBANK-SERVICE/accounts', { balance: 1, type: 'X', customerId: 1 })).s === 400);
ok('bad email 400', (await req(G + '/CUSTOMER-SERVICE/customers', { name: 'A', email: 'bad' })).s === 400);

for (const p of [PORTS.customer, PORTS.ebank, PORTS.bot, PORTS.auth]) {
  ok(`swagger ${p}`, (await req(`http://localhost:${p}/v3/api-docs`)).s === 200);
  ok(`swagger ui ${p}`, (await req(`http://localhost:${p}/swagger-ui/index.html`)).s === 200);
}
const cors = await fetch(G + '/CUSTOMER-SERVICE/customers', { headers: { Origin: 'http://localhost:4200' } });
ok('CORS single header', cors.headers.get('access-control-allow-origin') === 'http://localhost:4200');
ok('CORS foreign refused', (await fetch(G + '/CUSTOMER-SERVICE/customers', { headers: { Origin: 'https://foreign.test' } })).status === 403);

async function mcp(port) {
  const url = `http://localhost:${port}/mcp`;
  const h = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const init = await fetch(url, { method: 'POST', headers: h, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } } }) });
  await init.text();
  h['mcp-session-id'] = init.headers.get('mcp-session-id');
  await (await fetch(url, { method: 'POST', headers: h, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) })).text();
  const t = await (await fetch(url, { method: 'POST', headers: h, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }) })).text();
  return [...t.matchAll(/"name":"([A-Za-z]+)"/g)].map(m => m[1]);
}
const ct = await mcp(PORTS.customer), et = await mcp(PORTS.ebank);
ok('customer MCP 3 tools', ct.length === 3, ct);
ok('ebank MCP 4 tools', et.length === 4, et);

const conv = 'e2e-' + Date.now();
const ask = async (q, c = conv) => {
  await sleep(2500); // free-tier pacing
  const t = (await req(`${G}/EBANK-BOT/chat?` + new URLSearchParams({ query: q, conversationId: c }))).j;
  console.log(`  Q ${q}\n  A ${String(t).replace(/\n/g, '\n    ').slice(0, 1000)}`);
  return String(t);
};
ok('agent customers via MCP', /Mohammed[\s\S]*Imane[\s\S]*yassine/i.test(await ask('Je veux la liste des clients')));
const ids = list.j.filter(a => a.customerId === 2).map(a => a.id.slice(0, 8));
const reply = await ask('Donne-moi les comptes bancaires de Imane avec leur identifiant complet');
ok('agent chains tools', ids.every(i => reply.includes(i)));
await ask('Je m’appelle Karim');
ok('memory', /Karim/.test(await ask('Comment je m’appelle ?')));
ok('memory isolated', !/Karim/.test(await ask('Comment je m’appelle ?', conv + '-other')));
ok('scope refused', /ne sais pas/i.test(await ask('Donne-moi une recette de tajine')));

const before = (await req(G + '/EBANK-SERVICE/accounts')).j.length;
await ask('Ajoute un compte épargne avec un solde de 4000 MAD pour le client 2');
const after = (await req(G + '/EBANK-SERVICE/accounts')).j;
ok('agent creates account', after.length === before + 1 && Number(after.at(-1).balance) === 4000);

const mail = `salma${Date.now()}@example.com`;
await ask(`Ajoute le client Salma avec l'email ${mail}`);
ok('agent creates customer', (await req(G + '/CUSTOMER-SERVICE/customers')).j.some(c => c.email === mail));

await sleep(2500);
const t0 = Date.now();
const s = await fetch(`${G}/EBANK-BOT/chatStream?` + new URLSearchParams({ query: 'Liste de tous les comptes bancaires avec identifiant complet', conversationId: conv + '-stream' }));
let n = 0, first = 0, text = '';
const dec = new TextDecoder();
for await (const chunk of s.body) { n++; first ||= Date.now() - t0; text += dec.decode(chunk, { stream: true }); }
// Gemini sometimes sends the whole answer in very few bursts
ok('stream is chunked through gateway', n > 1, `chunks=${n} first=${first}ms total=${Date.now() - t0}ms`);
ok('stream has every account', after.every(a => text.includes(a.id.slice(0, 8))), text.slice(0, 250));
ok('stream charset', /utf-8/i.test(s.headers.get('content-type') ?? ''));

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
