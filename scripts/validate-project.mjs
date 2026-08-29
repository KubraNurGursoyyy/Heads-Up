import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const errors = [];

const read = relativePath =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const exists = relativePath =>
  fs.existsSync(path.join(root, relativePath));

const required = [
  'package.json',
  '.gitignore',
  'docker-compose.yml',
  'apps/api/package.json',
  'apps/api/.env.example',
  'apps/api/prisma/schema.prisma',
  'apps/api/src/main.ts',
  'apps/api/src/worker.ts',
  'apps/mobile/package.json',
  'apps/mobile/.env.example',
  'apps/mobile/App.tsx',
  'apps/mobile/app.config.js',
];

for (const file of required) {
  if (!exists(file)) errors.push(`Missing ${file}`);
}

for (const file of [
  'package.json',
  'apps/api/package.json',
  'apps/mobile/package.json',
  'apps/mobile/eas.json',
]) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    errors.push(`Invalid JSON ${file}: ${String(error)}`);
  }
}

const rootPackage = JSON.parse(read('package.json'));
if (rootPackage.dependencies?.expo) {
  errors.push(
    'Root package.json must not contain Expo dependencies; keep Expo packages in apps/mobile only.',
  );
}

if (exists('app.json')) {
  errors.push(
    'Unexpected root app.json found. The Expo app lives in apps/mobile; delete root app.json.',
  );
}

if (exists('android')) {
  errors.push(
    'Unexpected root android/ found. The real native project is apps/mobile/android; delete root android/.',
  );
}

const authController = read('apps/api/src/auth/auth.controller.ts');
if (!authController.includes("@Post('bootstrap')")) {
  errors.push('Single-user auth route POST /auth/bootstrap is missing.');
}

const authModule = read('apps/api/src/auth/auth.module.ts');
if (!authModule.includes('controllers: [AuthController]')) {
  errors.push('AuthController is not registered in AuthModule.');
}

const appModule = read('apps/api/src/app.module.ts');
if (!appModule.includes('AuthModule')) {
  errors.push('AuthModule is not registered in AppModule.');
}

const main = read('apps/api/src/main.ts');
const mobileEnvExample = read('apps/mobile/.env.example');
const sampleApiUrl = mobileEnvExample.match(
  /^EXPO_PUBLIC_API_URL=(.+)$/m,
)?.[1]?.trim();

if (
  sampleApiUrl &&
  !main.includes('setGlobalPrefix') &&
  /\/api\/?$/i.test(sampleApiUrl)
) {
  errors.push(
    'apps/mobile/.env.example ends in /api, but the Nest API has no global /api prefix.',
  );
}

const prismaSchema = read('apps/api/prisma/schema.prisma');
const models = [
  ...prismaSchema.matchAll(/^model\s+(\w+)\s*\{/gm),
].map(match => match[1]);

const migrationsDir = path.join(root, 'apps/api/prisma/migrations');
const migrationSql = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(migrationsDir, entry.name, 'migration.sql'))
  .filter(file => fs.existsSync(file))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');

const migratedTables = new Set(
  [...migrationSql.matchAll(/CREATE TABLE\s+"([^"]+)"/g)].map(
    match => match[1],
  ),
);

for (const model of models) {
  if (!migratedTables.has(model)) {
    errors.push(`Prisma model ${model} has no CREATE TABLE migration.`);
  }
}

const gitignore = read('.gitignore');
if (!gitignore.includes('**/.env')) {
  errors.push('.gitignore does not protect nested .env files.');
}

if (errors.length) {
  console.error('HeadsUp validation FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `HeadsUp validation OK (${required.length} critical files, ${models.length} Prisma models checked)`,
);
