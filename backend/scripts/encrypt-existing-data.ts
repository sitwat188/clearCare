/**
 * One-off script: encrypt existing plaintext data in the database.
 * Run after seeding if data was inserted before encryption was enabled.
 * Uses the same algorithm and key derivation as EncryptionService.
 *
 * Usage: npm run db:encrypt
 * Requires: .env with DATABASE_URL and ENCRYPTION_KEY (min 32 chars)
 */

import { PrismaClient } from '@prisma/client';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Load .env from backend root (parent of scripts/)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        )
          val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  }
}

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PREFIX = 'enc:';

function getEncryptKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be set and at least 32 characters (e.g. openssl rand -base64 32). ' +
        'Set it in .env and run again.',
    );
  }
  return scryptSync(secret.trim(), 'clearcare-salt', KEY_LENGTH);
}

function encrypt(plainText: string, key: Buffer): string {
  if (plainText == null || plainText === '') return '';
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  return PREFIX + combined.toString('base64');
}

function shouldEncrypt(value: string | null | undefined): boolean {
  if (value == null || value === '') return false;
  return !value.startsWith(PREFIX);
}

const prisma = new PrismaClient();

async function main() {
  const key = getEncryptKey();

  let patientsUpdated = 0;
  let instructionsUpdated = 0;
  let usersUpdated = 0;

  // --- Patients: encrypt PHI fields that are still plaintext ---
  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
  });
  for (const p of patients) {
    const updates: Record<string, string> = {};
    if (shouldEncrypt(p.dateOfBirth))
      updates.dateOfBirth = encrypt(p.dateOfBirth, key);
    if (shouldEncrypt(p.medicalRecordNumber))
      updates.medicalRecordNumber = encrypt(p.medicalRecordNumber, key);
    if (p.phone != null && shouldEncrypt(p.phone))
      updates.phone = encrypt(p.phone, key);
    if (p.addressStreet != null && shouldEncrypt(p.addressStreet))
      updates.addressStreet = encrypt(p.addressStreet, key);
    if (p.addressCity != null && shouldEncrypt(p.addressCity))
      updates.addressCity = encrypt(p.addressCity, key);
    if (p.addressState != null && shouldEncrypt(p.addressState))
      updates.addressState = encrypt(p.addressState, key);
    if (p.addressZipCode != null && shouldEncrypt(p.addressZipCode))
      updates.addressZipCode = encrypt(p.addressZipCode, key);
    if (p.emergencyContactName != null && shouldEncrypt(p.emergencyContactName))
      updates.emergencyContactName = encrypt(p.emergencyContactName, key);
    if (
      p.emergencyContactRelationship != null &&
      shouldEncrypt(p.emergencyContactRelationship)
    )
      updates.emergencyContactRelationship = encrypt(
        p.emergencyContactRelationship,
        key,
      );
    if (
      p.emergencyContactPhone != null &&
      shouldEncrypt(p.emergencyContactPhone)
    )
      updates.emergencyContactPhone = encrypt(p.emergencyContactPhone, key);

    if (Object.keys(updates).length > 0) {
      await prisma.patient.update({
        where: { id: p.id },
        data: updates,
      });
      patientsUpdated++;
    }
  }

  // --- Care instructions: encrypt content if plaintext ---
  const instructions = await prisma.careInstruction.findMany({
    where: { deletedAt: null },
  });
  for (const i of instructions) {
    if (i.content != null && shouldEncrypt(i.content)) {
      await prisma.careInstruction.update({
        where: { id: i.id },
        data: { content: encrypt(i.content, key) },
      });
      instructionsUpdated++;
    }
  }

  // --- Users: encrypt 2FA secret and backup codes if present and plaintext ---
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, twoFactorSecret: true, backupCodes: true },
  });
  for (const u of users) {
    const updates: Record<string, string> = {};
    if (u.twoFactorSecret != null && shouldEncrypt(u.twoFactorSecret)) {
      updates.twoFactorSecret = encrypt(u.twoFactorSecret, key);
    }
    if (u.backupCodes != null && shouldEncrypt(u.backupCodes)) {
      updates.backupCodes = encrypt(u.backupCodes, key);
    }
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: u.id },
        data: updates,
      });
      usersUpdated++;
    }
  }

  console.log('Encryption of existing data complete.');
  console.log(
    '  Patients (rows with at least one field encrypted):',
    patientsUpdated,
  );
  console.log('  Care instructions:', instructionsUpdated);
  console.log('  Users (2FA/backup codes):', usersUpdated);
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
