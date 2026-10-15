/**
 * @universal-plm/enterprise-scale
 * Disaster Recovery, Point-in-Time Backup & Restoration Engine
 * Supports Self-Contained Tenant Archives & Cryptographic Verification (TST-08, COM-05)
 */

/**
 * Isomorphic, self-contained SHA-256 implementation (FIPS 180-4)
 * Guarantees cryptographic integrity across both Node.js (AppSail) and Browser (Catalyst Slate)
 */
export function computeSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const utf8: number[] = [];
  for (let m = 0; m < ascii.length; m++) {
    let charcode = ascii.charCodeAt(m);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      m++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (ascii.charCodeAt(m) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  const bitLength = utf8.length * 8;
  utf8.push(0x80);
  while ((utf8.length % 64) !== 56) {
    utf8.push(0);
  }

  for (let o = 0; o < 4; o++) {
    utf8.push(0);
  }
  utf8.push(
    (bitLength >>> 24) & 0xff,
    (bitLength >>> 16) & 0xff,
    (bitLength >>> 8) & 0xff,
    bitLength & 0xff
  );

  const words: number[] = [];
  for (let w = 0; w < utf8.length; w += 4) {
    words.push((utf8[w] << 24) | (utf8[w + 1] << 16) | (utf8[w + 2] << 8) | utf8[w + 3]);
  }

  const wArray = new Array(64);
  for (let chunk = 0; chunk < words.length; chunk += 16) {
    for (let t = 0; t < 16; t++) {
      wArray[t] = words[chunk + t];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(wArray[t - 15], 7) ^ rightRotate(wArray[t - 15], 18) ^ (wArray[t - 15] >>> 3);
      const s1 = rightRotate(wArray[t - 2], 17) ^ rightRotate(wArray[t - 2], 19) ^ (wArray[t - 2] >>> 10);
      wArray[t] = (wArray[t - 16] + s0 + wArray[t - 7] + s1) | 0;
    }

    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + k[t] + wArray[t]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  return hash.map((h) => (h >>> 0).toString(16).padStart(8, '0')).join('');
}

export interface TenantBackupArchive {
  archiveId: string;
  tenantId: string;
  schemaVersion: string;
  createdAt: string;
  partsCount: number;
  bomLinesCount: number;
  ecosCount: number;
  documentsCount: number;
  payload: {
    parts: Array<{ id: string; partNumber: string; name: string; revision: string }>;
    bomLines: Array<{ parentPartId: string; childPartId: string; quantity: number }>;
    ecos: Array<{ id: string; ecoNumber: string; title: string; stage: string }>;
    documents: Array<{ id: string; docNumber: string; title: string; file: string }>;
  };
  sha256Checksum: string;
}

export interface RestoreValidationResult {
  valid: boolean;
  archiveId: string;
  tenantId: string;
  checksumMatches: boolean;
  brokenReferences: string[];
  errors: string[];
}

/**
 * Creates a complete point-in-time tenant backup archive with SHA-256 verification
 */
export function createTenantBackupArchive(
  tenantId: string,
  payload: TenantBackupArchive['payload']
): TenantBackupArchive {
  const archiveId = `BKP-${tenantId}-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const schemaVersion = '2026.4';

  const serializedPayload = JSON.stringify(payload);
  const sha256Checksum = computeSha256(
    `${archiveId}:${tenantId}:${schemaVersion}:${serializedPayload}`
  );

  return {
    archiveId,
    tenantId,
    schemaVersion,
    createdAt,
    partsCount: payload.parts.length,
    bomLinesCount: payload.bomLines.length,
    ecosCount: payload.ecos.length,
    documentsCount: payload.documents.length,
    payload,
    sha256Checksum
  };
}

/**
 * Validates a backup archive before performing disaster recovery restore:
 * 1. Verifies SHA-256 checksum to prevent tampering or corrupted backups
 * 2. Enforces referential integrity (all BOM child and parent IDs must exist in parts payload)
 */
export function validateBackupArchiveForRestore(
  archive: TenantBackupArchive,
  targetTenantId: string
): RestoreValidationResult {
  const errors: string[] = [];
  const brokenReferences: string[] = [];

  // 1. Verify tenant match
  if (archive.tenantId !== targetTenantId) {
    errors.push(`Tenant mismatch: Archive belongs to '${archive.tenantId}', restore attempted for '${targetTenantId}'`);
  }

  // 2. Verify SHA-256 Checksum
  const serializedPayload = JSON.stringify(archive.payload);
  const expectedChecksum = computeSha256(
    `${archive.archiveId}:${archive.tenantId}:${archive.schemaVersion}:${serializedPayload}`
  );

  const checksumMatches = expectedChecksum === archive.sha256Checksum;
  if (!checksumMatches) {
    errors.push('Integrity failure: Archive SHA-256 checksum mismatch (corrupted or tampered payload)');
  }

  // 3. Referential integrity
  const partIds = new Set(archive.payload.parts.map((p) => p.id));
  for (const line of archive.payload.bomLines) {
    if (!partIds.has(line.parentPartId)) {
      brokenReferences.push(`BOM line references non-existent parent part: '${line.parentPartId}'`);
    }
    if (!partIds.has(line.childPartId)) {
      brokenReferences.push(`BOM line references non-existent child part: '${line.childPartId}'`);
    }
  }

  if (brokenReferences.length > 0) {
    errors.push(`Referential integrity violation: ${brokenReferences.length} broken part references detected`);
  }

  return {
    valid: errors.length === 0,
    archiveId: archive.archiveId,
    tenantId: targetTenantId,
    checksumMatches,
    brokenReferences,
    errors
  };
}
