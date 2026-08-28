$ErrorActionPreference = "Stop"
if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host "Created .env - edit JWT_SECRET and API keys." }
if (-not (Test-Path apps/mobile/.env)) { Copy-Item apps/mobile/.env.example apps/mobile/.env; Write-Host "Created apps/mobile/.env - set your PC LAN IP and EAS project id." }
npm install
npm run prisma:generate
Write-Host "Dependencies installed. Start Docker, then run: npm run prisma:migrate"
