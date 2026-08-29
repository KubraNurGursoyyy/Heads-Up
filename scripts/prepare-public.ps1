$ErrorActionPreference = 'Stop'

$privatePaths = @(
  '.vercel',
  '.wrangler',
  'node_modules',
  'apps/api/.env',
  'apps/mobile/.env',
  'apps/api/node_modules',
  'apps/mobile/node_modules',
  'apps/api/dist',
  'apps/mobile/dist',
  'apps/mobile/dist-web-test',
  'apps/mobile/.expo',
  'apps/mobile/android/.gradle',
  'apps/mobile/android/local.properties',
  'apps/mobile/android/app/debug.keystore',
  'apps/mobile/android/app/build',
  'apps/mobile/android/build'
)

foreach ($path in $privatePaths) {
  git rm -r --cached --ignore-unmatch -- $path 2>$null
}

Write-Host ''
Write-Host 'Local secret files were left on disk; only Git tracking was removed.' -ForegroundColor Green
Write-Host 'Running public repository audit...' -ForegroundColor Cyan
npm run public:audit
