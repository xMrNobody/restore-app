/**
 * Mint a batch of sprint unlock codes for the free-APK validation sprint.
 *
 * Usage: node scripts/generate-codes.mjs [count] [outFile]
 *
 * The checksum scheme MUST match src/lib/unlockCodes.ts:
 *   code = XXXX-XXXX-CCCC where CCCC = f(SHA256(secret + ':' + payload))
 *   mapped from the first 8 hex chars into ALPHABET.
 */
import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// MUST match CODE_SECRET in src/lib/unlockCodes.ts
const CODE_SECRET = 'e315c2f0671cb3bfee4f9a4667042445874c8c8ef7b351c3';
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function checksum(payload) {
  const hex = createHash('sha256')
    .update(`${CODE_SECRET}:${payload}`)
    .digest('hex');
  let x = parseInt(hex.slice(0, 8), 16);
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[x % ALPHABET.length];
    x = Math.floor(x / ALPHABET.length);
  }
  return out;
}

function randomPayload() {
  const bytes = randomBytes(8);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

const count = parseInt(process.argv[2] ?? '200', 10);
const outFile = process.argv[3] ?? 'unlock-codes.txt';

const codes = new Set();
while (codes.size < count) {
  const p = randomPayload();
  codes.add(`${p.slice(0, 4)}-${p.slice(4)}-${checksum(p)}`);
}

writeFileSync(outFile, [...codes].join('\n') + '\n');
console.log(`Wrote ${codes.size} codes to ${outFile}`);
