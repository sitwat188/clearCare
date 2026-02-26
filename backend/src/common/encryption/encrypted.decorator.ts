/**
 * Decorators and helpers for encrypted fields (getter/setter-style usage).
 *
 * - Use @Encrypted() on class properties to mark them as encrypted-at-rest.
 * - Use decryptedViewOf(instance, encryptionService) to get a proxy that
 *   returns decrypted values for @Encrypted() fields (read-only).
 * - Use encryptForStorage(instance, encryptionService) to get a plain object
 *   with @Encrypted() fields encrypted (for Prisma create/update).
 *
 * Note: Prisma returns plain objects, not class instances, so decryptedView()
 * and encryptFields() on EncryptionService are often more convenient for
 * entity-to-response mapping. Use these decorators when you have actual
 * class instances (e.g. DTOs or response builders).
 */

const ENCRYPTED_FIELDS = Symbol.for('encrypted:fields');

/**
 * Mark a property as encrypted-at-rest. Metadata is stored on the constructor.
 * Used by decryptedViewOf() and encryptForStorage().
 */
export function Encrypted(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const ctor = target.constructor as { [ENCRYPTED_FIELDS]?: (string | symbol)[] };
    if (!ctor[ENCRYPTED_FIELDS]) {
      ctor[ENCRYPTED_FIELDS] = [];
    }
    ctor[ENCRYPTED_FIELDS].push(propertyKey);
  };
}

/**
 * Get the list of property keys marked with @Encrypted() on a class or instance.
 */
export function getEncryptedFieldKeys(instanceOrConstructor: object): (string | symbol)[] {
  const ctor = typeof instanceOrConstructor === 'function' ? instanceOrConstructor : instanceOrConstructor.constructor;
  return (ctor as { [ENCRYPTED_FIELDS]?: (string | symbol)[] })[ENCRYPTED_FIELDS] ?? [];
}

/**
 * Encryption service interface (minimal) for use with decorator helpers.
 */
export interface IEncryption {
  encrypt(plainText: string | null | undefined): string;
  decrypt(cipherText: string | null | undefined): string;
}

/**
 * Return a read-only proxy of the instance that decrypts @Encrypted() fields on read.
 * Other fields are returned as-is.
 */
export function decryptedViewOf<T extends Record<string, unknown>>(instance: T, encryption: IEncryption): T {
  const keys = getEncryptedFieldKeys(instance);
  return new Proxy(instance, {
    get(target, prop: string | symbol) {
      if (keys.includes(prop)) {
        return encryption.decrypt((target as Record<string, unknown>)[prop as string] as string);
      }
      return (target as Record<string, unknown>)[prop as string];
    },
    set() {
      return false;
    },
  });
}

/**
 * Return a plain object with @Encrypted() fields from the instance encrypted,
 * and all enumerable own properties included. Use for building Prisma payloads.
 */
export function encryptForStorage<T extends Record<string, unknown>>(
  instance: T,
  encryption: IEncryption,
): Record<string, unknown> {
  const keys = getEncryptedFieldKeys(instance);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(instance)) {
    const k = key as keyof T;
    const val = instance[k];
    if (keys.includes(k as string | symbol)) {
      out[key] = encryption.encrypt(val as string | null | undefined);
    } else {
      out[key] = val;
    }
  }
  return out;
}
