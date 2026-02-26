/**
 * Encryption service: encrypt/decrypt strings, decryptedView (getter-like), encryptFields (setter-like).
 * For class-based getters/setters use @Encrypted() and decryptedViewOf/encryptForStorage from './encrypted.decorator'.
 */
import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PREFIX = 'enc:';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  private readonly enabled: boolean;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY;
    if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
      throw new Error('ENCRYPTION_KEY must be set in production (at least 32 chars, e.g. openssl rand -base64 32)');
    }
    this.enabled = !!(secret && secret.length >= 32);
    this.key = this.enabled ? scryptSync(secret!, 'clearcare-salt', KEY_LENGTH) : Buffer.alloc(KEY_LENGTH);
  }

  /**
   * Encrypt a string (AES-256-GCM). Returns empty string for empty input.
   */
  encrypt(plainText: string | null | undefined): string {
    if (plainText == null || plainText === '') {
      return '';
    }
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: TAG_LENGTH,
    });
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, encrypted]);
    return PREFIX + combined.toString('base64');
  }

  /**
   * Decrypt a string. Returns empty string for empty input.
   * If value does not look encrypted (no prefix or decrypt fails), returns as-is for backward compatibility.
   */
  decrypt(cipherText: string | null | undefined): string {
    if (cipherText == null || cipherText === '') {
      return '';
    }
    if (!this.enabled || !cipherText.startsWith(PREFIX)) {
      return cipherText;
    }
    try {
      const combined = Buffer.from(cipherText.slice(PREFIX.length), 'base64');
      if (combined.length < IV_LENGTH + TAG_LENGTH) {
        return cipherText;
      }
      const iv = combined.subarray(0, IV_LENGTH);
      const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
      const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
        authTagLength: TAG_LENGTH,
      });
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch {
      return cipherText;
    }
  }

  /**
   * Deterministic hash of email for lookup (login, invite, uniqueness).
   * Normalizes: lower-case, trim. Returns hex string.
   */
  hashEmailForLookup(email: string | null | undefined): string {
    if (email == null || email === '') return '';
    const normalized = email.toLowerCase().trim();
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Return a read-only view of an object where the given keys are decrypted on read (getter-like).
   * Use when building API responses from Prisma entities.
   * @example
   *   const user = await this.prisma.user.findFirst(...);
   *   return this.encryption.decryptedView(user, ['email', 'firstName', 'lastName']);
   */
  decryptedView<T extends Record<string, unknown>>(raw: T, keys: (keyof T)[]): T {
    return new Proxy(raw, {
      get: (target, prop: string | symbol) => {
        const k = prop as keyof T;
        if (keys.includes(k)) {
          return this.decrypt(target[k] as string);
        }
        return target[k];
      },
      set: () => false, // read-only view
    });
  }

  /**
   * Return an object with the given keys from `plain` encrypted (setter-like for storage).
   * Use when building create/update payloads for Prisma. Skips keys that are undefined.
   * @example
   *   const updateData = {
   *     ...this.encryption.encryptFields(
   *       { firstName: dto.firstName, lastName: dto.lastName },
   *       ['firstName', 'lastName'],
   *     ),
   *     updatedAt: new Date(),
   *   };
   */
  encryptFields(plain: Record<string, string | null | undefined>, keys: string[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const key of keys) {
      if (key in plain && plain[key] !== undefined) {
        out[key] = this.encrypt(plain[key] ?? '');
      }
    }
    return out;
  }
}
