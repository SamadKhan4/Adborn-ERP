import { copyFile, mkdir, access } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';

// Checked-in copies support frontend-only deployments. In the monorepo,
// refresh them from the backend's canonical shared modules before building.
const source = new URL('../../backend/shared/', import.meta.url);
const destination = new URL('../shared/', import.meta.url);
try {
  await access(source);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  process.exit(0);
}
await mkdir(destination, { recursive: true });
for (const name of ['crm.js', 'crmImport.js', 'crmValidation.js', 'team.js']) {
  await copyFile(new URL(name, source), new URL(name, destination));
}
