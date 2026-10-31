// Finds your Telegram chat id so the server can message you.
//   1) Create a bot with @BotFather and put the token in .env (TELEGRAM_BOT_TOKEN=...)
//   2) From the Telegram account that should receive bookings (+998 90 710 64 64),
//      open your bot and press START (or send any message)
//   3) Run:  npm run telegram:setup
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(ROOT, '.env');
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const get = (k) => (envText.match(new RegExp(`^\\s*${k}\\s*=\\s*(.*?)\\s*$`, 'm')) || [])[1]?.replace(/^['"]|['"]$/g, '');

const token = process.env.TELEGRAM_BOT_TOKEN || get('TELEGRAM_BOT_TOKEN');
const api = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is missing. Create a bot with @BotFather, then add the token to .env');
  process.exit(1);
}

const call = async (method, body) => {
  const r = await fetch(`${api}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return r.json();
};

const me = await call('getMe');
if (!me.ok) {
  console.error('Telegram rejected the token:', me.description);
  process.exit(1);
}
console.log(`Bot: @${me.result.username}`);

const updates = await call('getUpdates', { limit: 100 });
const chats = new Map();
for (const u of updates.result || []) {
  const c = (u.message || u.edited_message || u.my_chat_member || {}).chat;
  if (c && c.type === 'private') chats.set(c.id, c);
}

if (!chats.size) {
  console.error(`\nNo chats found yet. Open https://t.me/${me.result.username} from the Telegram account that should get bookings, press START, then run this again.`);
  process.exit(1);
}

console.log('\nChats that wrote to your bot:');
for (const c of chats.values()) {
  console.log(`  chat id ${c.id}  —  ${[c.first_name, c.last_name].filter(Boolean).join(' ')} ${c.username ? '(@' + c.username + ')' : ''}`);
}

const chosen = [...chats.values()].at(-1);
if (chats.size > 1) console.log(`\nSeveral chats found — using the most recent one (${chosen.id}). Edit TELEGRAM_CHAT_ID in .env if that is wrong.`);

let out = envText;
if (/^\s*TELEGRAM_CHAT_ID\s*=/m.test(out)) out = out.replace(/^\s*TELEGRAM_CHAT_ID\s*=.*$/m, `TELEGRAM_CHAT_ID=${chosen.id}`);
else out += `${out && !out.endsWith('\n') ? '\n' : ''}TELEGRAM_CHAT_ID=${chosen.id}\n`;
fs.writeFileSync(envPath, out);
console.log(`\nSaved TELEGRAM_CHAT_ID=${chosen.id} to .env`);

const sent = await call('sendMessage', { chat_id: chosen.id, text: '✅ Travel Caravan: booking notifications are connected.' });
console.log(sent.ok ? 'Test message sent — check Telegram.' : `Could not send test message: ${sent.description}`);
