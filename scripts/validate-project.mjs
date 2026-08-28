import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const required=['package.json','docker-compose.yml','apps/api/package.json','apps/api/prisma/schema.prisma','apps/api/src/main.ts','apps/api/src/worker.ts','apps/mobile/package.json','apps/mobile/App.tsx','apps/mobile/app.config.js'];
for(const f of required){if(!fs.existsSync(path.join(root,f)))throw new Error(`Missing ${f}`)}
for(const f of ['package.json','apps/api/package.json','apps/mobile/package.json','apps/mobile/eas.json'])JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
console.log(`HeadsUp structure OK (${required.length} critical files checked)`);
