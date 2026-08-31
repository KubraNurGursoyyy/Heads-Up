import { spawn } from 'node:child_process';

const mode = process.argv[2] === 'export' ? 'export:web' : 'start:web';
const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error('npm_execpath bulunamadı. Bu scripti "npm run demo:web" üzerinden çalıştır.');
}

const child = spawn(process.execPath, [npmCli, '--workspace', '@headsup/mobile', 'run', mode], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_PUBLIC_DEMO_MODE: 'true',
    EXPO_PUBLIC_API_URL: '',
    EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY: '',
  },
});

child.on('error', error => {
  console.error('Demo başlatılamadı:', error);
  process.exit(1);
});

child.on('exit', code => {
  process.exit(code ?? 1);
});