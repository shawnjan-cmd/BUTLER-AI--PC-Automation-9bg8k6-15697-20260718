/**
 * Butler Android permission guard.
 * Run after `expo prebuild --platform android` to inspect the manifest that
 * Gradle will actually merge, while correctly honoring Expo removal directives.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const allowed = new Set([
  'android.permission.INTERNET',
  'android.permission.CAMERA',
  'android.permission.VIBRATE',
  'android.permission.USE_BIOMETRIC',
  'android.permission.USE_FINGERPRINT',
]);

if (!fs.existsSync(manifestPath)) {
  console.error('Generated AndroidManifest.xml not found. Run Expo prebuild before this check.');
  process.exit(1);
}

const manifest = fs.readFileSync(manifestPath, 'utf8');
const active = new Set();
for (const match of manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"([^>]*)\/?>(?:<\/uses-permission>)?/g)) {
  const [, name, attrs] = match;
  if (!attrs.includes('tools:node="remove"')) active.add(name);
}

const unexpected = [...active].filter((permission) => !allowed.has(permission));
if (unexpected.length) {
  console.error(`Unexpected active Android permissions: ${unexpected.join(', ')}`);
  process.exit(1);
}

console.log(`Generated permission guard passed: ${[...active].sort().join(', ')}`);
