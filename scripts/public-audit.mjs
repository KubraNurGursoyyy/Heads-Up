import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const forbiddenPaths = [
  /(^|\/)\.env($|\.)/i,
  /(^|\/)\.vercel(\/|$)/i,
  /(^|\/)\.dev\.vars($|\.)/i,
  /(^|\/)local\.properties$/i,
  /(^|\/)google-services\.json$/i,
  /(^|\/)(?:node_modules|dist|dist-web-test|build|\.expo|\.gradle)(\/|$)/i,
  /\.(?:pem|key|p12|pfx|jks|keystore)$/i,
];

const pathProblems = tracked.filter(file => {
  if (/(^|\/)\.env\.example$/i.test(file)) return false;
  return forbiddenPaths.some(pattern => pattern.test(file));
});

const contentRules = [
  { name: 'deployed Vercel URL', regex: /https?:\/\/[^\s"']+\.vercel\.app\b/i },
  { name: 'Neon hostname', regex: /\b[^\s"']+\.neon\.tech\b/i },
  { name: 'database credential URL', regex: /postgres(?:ql)?:\/\/(?!USER:PASSWORD@HOST)[^\s"']+@[^\s"']+/i },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: 'private key material', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'real JWT secret', regex: /^JWT_SECRET=(?!replace-with|YOUR_|<|$).+/im },
  { name: 'real single-user key', regex: /^HEADSUP_SINGLE_USER_KEY=(?!replace-with|YOUR_|SET_|<|$).+/im },
  { name: 'real cron secret', regex: /^HEADSUP_CRON_SECRET=(?!replace-with|YOUR_|SET_|<|$).+/im },
  { name: 'real mobile bootstrap key', regex: /^EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY=(?!replace-with|YOUR_|SET_|<|$).+/im },
];

const contentProblems = [];
for (const file of tracked) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > 2_000_000) continue;

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\u0000')) continue;

  for (const rule of contentRules) {
    if (rule.regex.test(content)) {
      contentProblems.push(`${file}: ${rule.name}`);
    }
  }
}

if (pathProblems.length || contentProblems.length) {
  console.error('Public repository audit FAILED.');
  if (pathProblems.length) {
    console.error('\nTracked private/local paths:');
    for (const file of pathProblems) console.error(`- ${file}`);
  }
  if (contentProblems.length) {
    console.error('\nSensitive content patterns:');
    for (const problem of contentProblems) console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`Public repository audit OK (${tracked.length} tracked files checked).`);
