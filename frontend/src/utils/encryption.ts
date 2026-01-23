/**
 * Encryption utilities for PHI (Protected Health Information) fields
 * Uses AES-256 encryption for sensitive data
 * HIPAA Compliance: All PHI must be encrypted at rest and in transit
 */

import CryptoJS from 'crypto-js';

// Get encryption key from environment or use default for development
const getEncryptionKey = (): string => {
  const key = import.meta.env.VITE_ENCRYPTION_KEY || 'clearcare-default-encryption-key-32chars';
  if (key.length < 32) {
    console.warn('Encryption key should be at least 32 characters for AES-256');
  }
  return key;
};

/**
 * Encrypts sensitive PHI data
 * @param data - Plain text data to encrypt
 * @returns Encrypted string (base64 encoded)
 */
export const encryptPHI = (data: string): string => {
  if (!data) return '';
  
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt PHI data');
  }
};

/**
 * Decrypts encrypted PHI data
 * @param encryptedData - Encrypted string (base64 encoded)
 * @returns Decrypted plain text
 */
export const decryptPHI = (encryptedData: string): string => {
  if (!encryptedData) return '';
  
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt PHI data');
  }
};

/**
 * Encrypts an object's PHI fields
 * @param obj - Object containing PHI fields
 * @param phiFields - Array of field names that contain PHI
 * @returns Object with encrypted PHI fields
 */
export const encryptObjectPHI = <T extends Record<string, any>>(
  obj: T,
  phiFields: (keyof T)[]
): T => {
  const encrypted = { ...obj };
  
  phiFields.forEach((field) => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptPHI(encrypted[field] as string) as T[keyof T];
    }
  });
  
  return encrypted;
};

/**
 * Decrypts an object's PHI fields
 * @param obj - Object with encrypted PHI fields
 * @param phiFields - Array of field names that contain PHI
 * @returns Object with decrypted PHI fields
 */
export const decryptObjectPHI = <T extends Record<string, any>>(
  obj: T,
  phiFields: (keyof T)[]
): T => {
  const decrypted = { ...obj };
  
  phiFields.forEach((field) => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decryptPHI(decrypted[field] as string) as T[keyof T];
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  });
  
  return decrypted;
};

/**
 * PHI field names that should be encrypted
 */
export const PHI_FIELDS = {
  PATIENT: ['firstName', 'lastName', 'dateOfBirth', 'email', 'phone', 'medicalRecordNumber', 'address'] as const,
  INSTRUCTION: ['patientId', 'patientName'] as const,
  COMPLIANCE: ['patientId', 'patientName'] as const,
} as const;
