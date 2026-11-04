// Attack cases against the running application: node tests/security.test.mjs
// Credentials are random. It creates users: use a disposable AUTH_DB_URL.
import { GATEWAY, PORTS } from './config.mjs';
import { randomBytes, createHmac } from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import net from 'node:net';

const G = GATEWAY;
let pass = 0, fail = 0;
const ok = (name, value, extra = '') => { value ? pass++ : fail++; console.log(`${value ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const call = async (p, { body, token, headers = {}, method } = {}) => {
  const r = await fetch(G + p, { method: method ?? (body ? 'POST' : 'GET'), body: body && JSON.stringify(body),
    headers: { ...(body && { 'content-type': 'application/json' }), ...(token && { authorization: 'Bearer ' + token }), ...headers } });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  return { s: r.status, j, t, h: r.headers };
};
const raw = path => new Promise((res, rej) => http.get({ host: '127.0.0.1', port: PORTS.gateway, path, headers: { authorization: 'Bearer ' + token } }, r => { r.resume(); res(r.statusCode); }).on('error', rej));
const password = () => randomBytes(15).toString('base64url');
const email = () => `e2e-${randomBytes(5).toString('hex')}@example.com`;
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');

const me = { name: 'E2E', email: email(), password: password() };
const created = await call('/AUTH-SERVICE/auth/signup', { body: me });
ok('signup 201', created.s === 201);
const token = created.j.token;
ok('no hash or password in response', !/passwordHash|\$2a\$/.test(created.t) && !created.t.includes(me.password));
ok('duplicate 409', (await call('/AUTH-SERVICE/auth/signup', { body: me })).s === 409);
ok('short password 400', (await call('/AUTH-SERVICE/auth/signup', { body: { ...me, email: email(), password: 'short' } })).s === 400);
ok('72+ bytes 400', (await call('/AUTH-SERVICE/auth/signup', { body: { ...me, email: email(), password: 'é'.repeat(40) } })).s === 400);
ok('login case-insensitive', (await call('/AUTH-SERVICE/auth/login', { body: { email: me.email.toUpperCase(), password: me.password } })).s === 200);
const wrong = await call('/AUTH-SERVICE/auth/login', { body: { email: me.email, password: password() } });
const unknown = await call('/AUTH-SERVICE/auth/login', { body: { email: email(), password: password() } });
ok('same error for unknown and wrong', wrong.s === 401 && unknown.s === 401 && wrong.j.detail === unknown.j.detail, wrong.t);
ok('me', (await call('/AUTH-SERVICE/auth/me', { token })).j.email === me.email);

const locked = email();
for (let i = 0; i < 5; i++) await call('/AUTH-SERVICE/auth/login', { body: { email: locked, password: password() } });
ok('lockout 429', (await call('/AUTH-SERVICE/auth/login', { body: { email: locked, password: password() } })).s === 429);

const guarded = ['/CUSTOMER-SERVICE/customers', '/CUSTOMER-SERVICE/customers/1', '/EBANK-SERVICE/accounts', '/EBANK-BOT/chat?query=hi', '/EBANK-BOT/chatStream?query=hi', '/AUTH-SERVICE/auth/me'];
for (const p of guarded) ok(`401 anonymous ${p}`, (await call(p)).s === 401);
ok('401 anonymous POST', (await call('/EBANK-SERVICE/accounts', { body: { balance: 1, type: 'SAVING_ACCOUNT', customerId: 1 } })).s === 401);

const [head, claims, sig] = token.split('.');
const c = JSON.parse(Buffer.from(claims, 'base64url'));
const signed = (payload, key = randomBytes(48)) => { const d = `${head}.${b64(payload)}`; return `${d}.${createHmac('sha256', key).update(d).digest('base64url')}`; };
for (const [name, t] of [['garbage', 'abc.def.ghi'], ['alg none', `${b64({ alg: 'none' })}.${claims}.`], ['edited subject', `${head}.${b64({ ...c, sub: '999' })}.${sig}`], ['other key', signed(c)]])
  ok(`401 forged token: ${name}`, (await call('/EBANK-SERVICE/accounts', { token: t })).s === 401);

ok('allowed with token', (await call('/EBANK-SERVICE/accounts', { token })).s === 200);
for (const p of ['/EBANK-SERVICE/h2-console', '/EBANK-SERVICE/h2-console/login.do', '/EBANK-SERVICE/mcp', '/CUSTOMER-SERVICE/mcp', '/EBANK-SERVICE/actuator/circuitbreakers', '/EBANK-SERVICE/v3/api-docs', '/ebank-service/h2-console', '/actuator/env']) {
  const s = (await call(p, { token })).s;
  ok(`blocked with token ${p}`, s === 403 || s === 404, s);
}
for (const p of ['/EBANK-SERVICE/accounts/../h2-console', '/EBANK-SERVICE/accounts/%2e%2e/h2-console', '/EBANK-SERVICE/accounts/..%2fh2-console', '/EBANK-SERVICE//h2-console', '/EBANK-SERVICE/accounts;/../mcp']) {
  const s = await raw(p);
  ok(`traversal blocked ${p}`, s >= 400, s);
}

const pre = await fetch(G + '/EBANK-SERVICE/accounts', { method: 'OPTIONS', headers: { origin: 'http://localhost:4200', 'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization,content-type' } });
ok('preflight', pre.ok && pre.headers.get('access-control-allow-origin') === 'http://localhost:4200');
ok('401 carries CORS', (await call('/EBANK-SERVICE/accounts', { headers: { origin: 'http://localhost:4200' } })).h.get('access-control-allow-origin') === 'http://localhost:4200');

const csrf = await new Promise(res => http.get({ host: '127.0.0.1', port: PORTS.bot, path: '/chat?query=hi', headers: { 'Sec-Fetch-Site': 'cross-site' } }, r => { r.resume(); res(r.statusCode); }));
ok('cross-site chat refused', csrf === 403 || csrf === 404, csrf);
ok('h2 console off', (await fetch(`http://localhost:${PORTS.ebank}/h2-console`)).status === 404);

const lan = Object.values(os.networkInterfaces()).flat().find(a => a.family === 'IPv4' && !a.internal)?.address;
if (lan) for (const port of Object.values(PORTS)) {
  const open = await new Promise(res => { const s = net.connect({ host: lan, port, timeout: 1500 }); s.on('connect', () => { s.destroy(); res(true); }); s.on('error', () => res(false)); s.on('timeout', () => { s.destroy(); res(false); }); });
  ok(`not reachable from network :${port}`, !open);
}

// conversation memory is separated by the verified user
const other = (await call('/AUTH-SERVICE/auth/signup', { body: { name: 'Other', email: email(), password: password() } })).j.token;
const q = (text, t, extra = {}) => call('/EBANK-BOT/chat?' + new URLSearchParams({ query: text, conversationId: 'same-id' }), { token: t, headers: extra });
await q('Je m’appelle Zakaria', token);
await new Promise(r => setTimeout(r, 2500));
ok('memory separated per user', !/Zakaria/.test((await q('Comment je m’appelle ?', other, { 'X-User-Id': String(created.j.user.id) })).t));

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
