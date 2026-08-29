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
  'apps/api/src/common/text-normalization.ts',
  'apps/api/src/common/text-normalization.test.mjs',
  'apps/api/src/common/required-terms.ts',
  'apps/api/src/common/required-terms.test.mjs',
  'apps/mobile/package.json',
  'apps/mobile/.env.example',
  'apps/mobile/App.tsx',
  'apps/mobile/app.config.js',
  'apps/mobile/src/utils/watch-ui.ts',
  'apps/mobile/src/utils/watch-ui.test.mjs',
  'apps/mobile/src/components/SoftProgressBar.tsx',
  'apps/mobile/src/components/ConfirmModal.tsx',
  'apps/mobile/src/components/CategoryPickerModal.tsx',
  'apps/mobile/src/screens/ArchiveScreen.tsx',
  'apps/mobile/src/settings.ts',
  'apps/api/src/articles/archive-pagination.ts',
  'apps/api/src/articles/archive-pagination.test.mjs',
  'apps/api/src/sources/search-plan.ts',
  'apps/api/src/sources/search-plan.test.mjs',
  'apps/api/src/sources/book-search.ts',
  'apps/api/src/sources/book-search.test.mjs',
  'apps/api/src/sources/rss-image.ts',
  'apps/api/src/sources/rss-image.test.mjs',
  'apps/api/prisma/migrations/202608290003_article_image_url/migration.sql',
  'apps/api/prisma/migrations/202608290004_watch_intersection/migration.sql',
  'apps/api/prisma/migrations/202608290005_required_terms/migration.sql',
  'scripts/public-audit.mjs',
  'scripts/prepare-public.ps1',
  'apps/mobile/src/components/TopicDropdown.tsx',
  'apps/mobile/src/components/RequiredTermsPicker.tsx',
  'apps/mobile/src/components/HighlightedTopic.tsx',
  'apps/mobile/src/components/EditWatchModal.tsx',
  'apps/mobile/src/utils/feed-topics.ts',
  'apps/mobile/src/utils/feed-topics.test.mjs',
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


const watchesController = read('apps/api/src/watches/watches.controller.ts');
if (!watchesController.includes("@Post('suggest')")) {
  errors.push('POST /watches/suggest is missing.');
}
if (!watchesController.includes("@Get('categories')")) {
  errors.push('GET /watches/categories is missing.');
}

if (!watchesController.includes("@Post(':id/run')")) {
  errors.push('POST /watches/:id/run is missing.');
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


const watchesService = read('apps/api/src/watches/watches.service.ts');
if (!watchesService.includes('buildQuickWatch')) {
  errors.push('Watch creation is doing blocking interpretation instead of fast preparation.');
}

if (!/this\.pipeline\.processWatch\(id(?:,|\))/.test(watchesService)) {
  errors.push('Manual scan must run the pipeline directly so the button works without a worker.');
}
if (!watchesService.includes('this.prisma.$transaction')) {
  errors.push('Watch deletion must use a transaction.');
}
if (!watchesService.includes('normalizeCategoryName(data.category)')) {
  errors.push('Watch category must be editable and normalized on update.');
}

const queueService = read('apps/api/src/jobs/queue.service.ts');
if (!queueService.includes('allowInlineServerless')) {
  errors.push('QueueService is missing non-blocking serverless watch creation behavior.');
}



const sourcesService = read('apps/api/src/sources/sources.service.ts');
if (!sourcesService.includes('WATCH_HISTORICAL_RESULT_LIMIT')) {
  errors.push('Historical discovery result limit is missing.');
}
if (!sourcesService.includes('buildGoogleNewsSearchPlan')) {
  errors.push('Google News discovery must use the multilingual historical search plan.');
}
if (!sourcesService.includes('openLibraryCatalog')) {
  errors.push('Book tracking must include the keyless Open Library catalog adapter.');
}
if (!sourcesService.includes('buildBookNewsQueries')) {
  errors.push('Book tracking must add translation/publisher/ISBN discovery queries.');
}
const searchPlan = read('apps/api/src/sources/search-plan.ts');
if (!searchPlan.includes("{ lang: 'en', country: 'US' }")) {
  errors.push('Search plan must include English Google News as a fallback.');
}
if (!searchPlan.includes('when:1y') || !searchPlan.includes('after:${fiveYearsAgo(now)}')) {
  errors.push('Search plan must include historical backfill queries.');
}

const articlesController = read('apps/api/src/articles/articles.controller.ts');
if (!articlesController.includes("@Get('archive')")) {
  errors.push('GET /feed/archive is missing.');
}
const articlesService = read('apps/api/src/articles/articles.service.ts');
if (!articlesService.includes('ARCHIVE_PAGE_SIZE')) {
  errors.push('Archive must use fixed server-side pagination.');
}

const watchesDto = read('apps/api/src/watches/watches.dto.ts');
if (!/category\?:\s*string/.test(watchesDto)) {
  errors.push('UpdateWatchDto must allow manual category changes.');
}

const watchesScreen = read('apps/mobile/src/screens/WatchesScreen.tsx');
if (!watchesScreen.includes('ConfirmModal')) {
  errors.push('Watch deletion must use the cross-platform confirmation modal.');
}
if (!watchesScreen.includes('CategoryPickerModal')) {
  errors.push('Watch screen must allow manual category changes.');
}

const feedScreen = read('apps/mobile/src/screens/FeedScreen.tsx');
if (!feedScreen.includes('onOpenArchive')) {
  errors.push('Feed must expose the old-news archive entry point.');
}

const appConfig = read('apps/mobile/app.config.js');
if (!appConfig.includes("resizeMode: 'contain'")) {
  errors.push('Splash must use contain so the artwork is not cropped.');
}
if (!appConfig.includes("image: './assets/native-splash-transparent.png'")) {
  errors.push('Native splash must stay visually neutral so only the responsive splash artwork is shown.');
}
const splashWidth = Number(appConfig.match(/imageWidth:\s*(\d+)/)?.[1] ?? 0);
if (!splashWidth || splashWidth > 8) {
  errors.push('Native splash placeholder must stay tiny so it never appears as a second logo splash.');
}


if (!watchesDto.includes('requiredTerms')) {
  errors.push('CreateWatchDto must support required watch terms.');
}
if (!searchPlan.includes("reason: 'required'") && !searchPlan.includes("'required'")) {
  errors.push('Search plan must include required-term queries.');
}
if (!feedScreen.includes('compactVisible')) {
  errors.push('Feed filters must expose a stable compact overlay while the news list is scrolled.');
}

const prismaSchema = read('apps/api/prisma/schema.prisma');

if (/enum\s+Category\s*\{/.test(prismaSchema)) {
  errors.push('Prisma Category enum is still fixed; categories must be dynamic text.');
}
if (!/category\s+String/.test(prismaSchema)) {
  errors.push('Watch.category must be a String for dynamic categories.');
}

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


if (!/ALTER TABLE\s+"Watch"[\s\S]*ALTER COLUMN\s+"category"\s+TYPE TEXT/.test(migrationSql)) {
  errors.push('Dynamic category migration is missing.');
}

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
