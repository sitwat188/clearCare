/**
 * One-off script: encrypt existing plaintext data in the database.
 * Run after seeding if data was inserted before encryption was enabled.
 * Uses the same algorithm and key derivation as EncryptionService.
 *
 * Usage: npm run db:encrypt
 * Optional:  npm run db:encrypt -- --emails=addr1@x.com,addr2@y.com  (only encrypt these users)
 * Requires: .env with DATABASE_URL and ENCRYPTION_KEY (min 32 chars)
 *
 * Encrypted columns by table:
 * - users: email, firstName, lastName, twoFactorSecret, backupCodes (emailHash is set if missing)
 * - patients: dateOfBirth, medicalRecordNumber, phone, addressStreet, addressCity, addressState,
 *   addressZipCode, emergencyContactName, emergencyContactRelationship, emergencyContactPhone
 * - care_instructions: content, medicationDetails, lifestyleDetails, followUpDetails, warningDetails (JSON as _encrypted)
 * - instruction_templates: name, description, content, details (JSON as _encrypted)
 * - notifications: title, message
 */

import { PrismaClient } from '@prisma/client';
import { createCipheriv, createHash, randomBytes, scryptSync } from 'crypto';
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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
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
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  return PREFIX + combined.toString('base64');
}

function shouldEncrypt(value: string | null | undefined): boolean {
  if (value == null || value === '') return false;
  return !value.startsWith(PREFIX);
}

/** Deterministic hash of email for lookup (same as EncryptionService). */
function hashEmailForLookup(email: string | null | undefined): string {
  if (email == null || email === '') return '';
  const normalized = email.toLowerCase().trim();
  return createHash('sha256').update(normalized).digest('hex');
}

const prisma = new PrismaClient();

/** Parse --emails=addr1,addr2 from argv (optional). Normalized to lower-case. */
function getEmailsFilter(): Set<string> | null {
  const arg = process.argv.find((a) => a.startsWith('--emails='));
  if (!arg) return null;
  const list = arg.slice('--emails='.length).trim();
  if (!list) return null;
  const emails = list
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.length > 0 ? new Set(emails) : null;
}

async function main() {
  const key = getEncryptKey();
  const emailsFilter = getEmailsFilter();
  if (emailsFilter) {
    console.log('Filtering users by email:', [...emailsFilter].join(', '));
  }

  let patientsUpdated = 0;
  let instructionsUpdated = 0;
  let usersUpdated = 0;
  let notificationsUpdated = 0;
  let templatesUpdated = 0;

  // --- Patients: encrypt PHI fields that are still plaintext ---
  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
  });
  for (const p of patients) {
    const updates: Record<string, string> = {};
    if (shouldEncrypt(p.dateOfBirth)) updates.dateOfBirth = encrypt(p.dateOfBirth, key);
    if (shouldEncrypt(p.medicalRecordNumber)) updates.medicalRecordNumber = encrypt(p.medicalRecordNumber, key);
    if (p.phone != null && shouldEncrypt(p.phone)) updates.phone = encrypt(p.phone, key);
    if (p.addressStreet != null && shouldEncrypt(p.addressStreet))
      updates.addressStreet = encrypt(p.addressStreet, key);
    if (p.addressCity != null && shouldEncrypt(p.addressCity)) updates.addressCity = encrypt(p.addressCity, key);
    if (p.addressState != null && shouldEncrypt(p.addressState)) updates.addressState = encrypt(p.addressState, key);
    if (p.addressZipCode != null && shouldEncrypt(p.addressZipCode))
      updates.addressZipCode = encrypt(p.addressZipCode, key);
    if (p.emergencyContactName != null && shouldEncrypt(p.emergencyContactName))
      updates.emergencyContactName = encrypt(p.emergencyContactName, key);
    if (p.emergencyContactRelationship != null && shouldEncrypt(p.emergencyContactRelationship))
      updates.emergencyContactRelationship = encrypt(p.emergencyContactRelationship, key);
    if (p.emergencyContactPhone != null && shouldEncrypt(p.emergencyContactPhone))
      updates.emergencyContactPhone = encrypt(p.emergencyContactPhone, key);

    if (Object.keys(updates).length > 0) {
      await prisma.patient.update({
        where: { id: p.id },
        data: updates,
      });
      patientsUpdated++;
    }
  }

  // --- Care instructions: encrypt content and JSON details if plaintext ---
  const instructions = await prisma.careInstruction.findMany({
    where: { deletedAt: null },
  });
  for (const i of instructions) {
    const updates: Record<string, unknown> = {};
    if (i.content != null && shouldEncrypt(i.content)) {
      updates.content = encrypt(i.content, key);
    }
    const jsonFields = ['medicationDetails', 'lifestyleDetails', 'followUpDetails', 'warningDetails'] as const;
    for (const field of jsonFields) {
      const val = i[field];
      if (val != null && typeof val === 'object' && !('_encrypted' in val)) {
        try {
          updates[field] = {
            _encrypted: encrypt(JSON.stringify(val), key),
          };
        } catch {
          // skip if not serializable
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await prisma.careInstruction.update({
        where: { id: i.id },
        data: updates,
      });
      instructionsUpdated++;
    }
  }

  // --- Users: encrypt email, firstName, lastName, 2FA secret, backup codes if plaintext ---
  // Include all users (including soft-deleted) so no plaintext is left
  const users = await prisma.user.findMany({});
  for (const u of users) {
    const emailPlain = shouldEncrypt(u.email) ? u.email : '';
    if (emailsFilter && emailPlain !== '') {
      const normalized = emailPlain.toLowerCase().trim();
      if (!emailsFilter.has(normalized)) continue;
    }
    const updates: Record<string, string> = {};
    if (shouldEncrypt(u.email)) {
      updates.email = encrypt(u.email, key);
      const emailHash = (u as { emailHash?: string | null }).emailHash;
      if (!emailHash || emailHash === '') {
        updates.emailHash = hashEmailForLookup(u.email);
      }
    }
    if (shouldEncrypt(u.firstName)) {
      updates.firstName = encrypt(u.firstName, key);
    }
    if (shouldEncrypt(u.lastName)) {
      updates.lastName = encrypt(u.lastName, key);
    }
    if (u.twoFactorSecret != null && shouldEncrypt(u.twoFactorSecret)) {
      updates.twoFactorSecret = encrypt(u.twoFactorSecret, key);
    }
    if (u.backupCodes != null && shouldEncrypt(u.backupCodes)) {
      updates.backupCodes = encrypt(u.backupCodes, key);
    }
    if (Object.keys(updates).length > 0) {
      try {
        await prisma.user.update({
          where: { id: u.id },
          data: updates,
        });
        usersUpdated++;
        if (emailPlain) {
          console.log('  Encrypted user:', emailPlain);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  Failed to encrypt user ${u.id} (${emailPlain || 'no-email'}):`, msg);
      }
    }
  }

  // --- Instruction templates: encrypt name, description, content, details if plaintext ---
  const templates = await prisma.instructionTemplate.findMany();
  for (const t of templates) {
    const updates: Record<string, unknown> = {};
    if (shouldEncrypt(t.name)) updates.name = encrypt(t.name, key);
    if (t.description != null && shouldEncrypt(t.description)) updates.description = encrypt(t.description, key);
    if (shouldEncrypt(t.content)) updates.content = encrypt(t.content, key);
    const details = t.details;
    if (details != null && typeof details === 'object' && !('_encrypted' in details)) {
      try {
        updates.details = { _encrypted: encrypt(JSON.stringify(details), key) };
      } catch {
        // skip
      }
    }
    if (Object.keys(updates).length > 0) {
      await prisma.instructionTemplate.update({
        where: { id: t.id },
        data: updates,
      });
      templatesUpdated++;
    }
  }

  // --- Notifications: encrypt title and message if plaintext ---
  const notifications = await prisma.notification.findMany({
    select: { id: true, title: true, message: true },
  });
  for (const n of notifications) {
    const updates: Record<string, string> = {};
    if (shouldEncrypt(n.title)) updates.title = encrypt(n.title, key);
    if (shouldEncrypt(n.message)) updates.message = encrypt(n.message, key);
    if (Object.keys(updates).length > 0) {
      await prisma.notification.update({
        where: { id: n.id },
        data: updates,
      });
      notificationsUpdated++;
    }
  }

  console.log('Encryption of existing data complete.');
  console.log('  Patients (rows with at least one field encrypted):', patientsUpdated);
  console.log('  Care instructions:', instructionsUpdated);
  console.log('  Users (email/name/2FA/backup codes):', usersUpdated);
  console.log('  Instruction templates:', templatesUpdated);
  console.log('  Notifications:', notificationsUpdated);
}

main()
  .catch((e: Error) => {
    console.error('Error:', e?.message ?? String(e));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
