import fs from 'fs';
import path from 'path';

console.log('=== BUTLER AI: CLEAN RELEASE VALIDATION START ===');

const requiredFiles = [
  'app/_layout.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/scripts.tsx',
  'app/(tabs)/butler.tsx',
  'app/(tabs)/knowledge.tsx',
  'app/(tabs)/monitor.tsx',
  'app/(tabs)/cosmetic.tsx',
  'app/(tabs)/settings.tsx',
  'app/(tabs)/onboarding.tsx',
  'server/butler_server_v20_1_0_OSS.py',
  'server/flow_ledger.py',
  'server/flow_ledger_test.py',
  'package.json',
  'app.json'
];

let missing = 0;
for (const file of requiredFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] Missing required release file: ${file}`);
    missing++;
  } else {
    console.log(`[OK] Found ${file}`);
  }
}

if (missing > 0) {
  console.error(`\nValidation failed: ${missing} required files missing.`);
  process.exit(1);
} else {
  console.log('\n=== BUTLER AI: ALL REQUIRED RELEASE FILES PRESENT ===');
}
