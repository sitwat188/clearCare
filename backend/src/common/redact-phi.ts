/**
 * HIPAA: Redact PHI from strings and objects before logging or audit payloads.
 * Use these when writing to audit logs or log statements that might contain PHI.
 */

const PHI_KEYS = [
  'email',
  'old_email',
  'new_email',
  'firstName',
  'lastName',
  'first_name',
  'last_name',
  'ssn',
  'social_security_number',
  'medical_record_number',
  'mrn',
  'dob',
  'date_of_birth',
  'birth_date',
  'address',
  'phone',
  'phone_number',
  'street',
  'city',
  'state',
  'zip',
  'postal_code',
  'credit_card',
  'creditcard',
  'account_number',
  'data_content',
  'encrypted_',
];

const REDACTED = '[REDACTED]';

/**
 * Redact a string (e.g. email, password) for safe logging.
 */
export function redactPHIFromString(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '';
  return REDACTED;
}

/**
 * Redact PHI keys in an object for audit payloads or logging.
 * Returns a new object with PHI values replaced by [REDACTED].
 */
export function redactPHIFromObject<T extends Record<string, unknown>>(
  obj: T | null | undefined,
): T {
  if (obj == null || typeof obj !== 'object') return obj as unknown as T;
  const out = { ...obj } as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    const keyLower = key.toLowerCase();
    const isPhi =
      PHI_KEYS.some((k) => keyLower === k.toLowerCase()) ||
      keyLower.includes('email') ||
      keyLower.includes('password') ||
      keyLower.includes('ssn') ||
      keyLower.includes('phone');
    if (isPhi && out[key] != null) {
      out[key] = REDACTED;
    }
  }
  return out as T;
}

/**
 * Create a safe object for logging (alias for redactPHIFromObject for audit config).
 */
export function createSafeLogObject<T extends Record<string, unknown>>(
  obj: T | null | undefined,
): T {
  return redactPHIFromObject(obj);
}
