import * as Crypto from 'expo-crypto';

/**
 * Sprint unlock codes. Lets the user hand out Pro access during the free-APK
 * validation sprint (before Google Play billing exists).
 *
 * A code looks like `KQ7M-2ZXF-9P4D`: 8 random characters + a 4-character
 * checksum derived from CODE_SECRET. Validation is offline, so codes can be
 * checked without a server. The secret below MUST match the one in
 * scripts/generate-codes.mjs (used to mint the code batch).
 *
 * Sprint-only: rotate the secret and switch to real Play billing before the
 * public launch. Codes are not single-use and can be shared — acceptable for
 * a small validation sprint, not for production.
 */
const CODE_SECRET = 'e315c2f0671cb3bfee4f9a4667042445874c8c8ef7b351c3';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L
const CODE_RE = /^([A-Z2-9]{4})-([A-Z2-9]{4})-([A-Z2-9]{4})$/;

async function checksum(payload: string): Promise<string> {
  const hex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${CODE_SECRET}:${payload}`,
  );
  let x = parseInt(hex.slice(0, 8), 16);
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[x % ALPHABET.length];
    x = Math.floor(x / ALPHABET.length);
  }
  return out;
}

/** Normalize user input: trim, uppercase, tolerate missing dashes. */
function normalize(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (clean.length !== 12) return raw.trim().toUpperCase();
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}

/** True when the code is well-formed and its checksum matches the secret. */
export async function validateUnlockCode(raw: string): Promise<boolean> {
  const m = CODE_RE.exec(normalize(raw));
  if (!m) return false;
  const payload = m[1] + m[2];
  return (await checksum(payload)) === m[3];
}
