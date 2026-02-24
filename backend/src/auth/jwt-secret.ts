/**
 * Single source for JWT signing secrets.
 * Production: env vars required (main.ts enforces at bootstrap).
 * Development: fallback so the app can run without .env.
 */

const DEV_JWT_SECRET = 'dev-jwt-secret-change-in-production';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-change-in-production';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production. See .env.example.');
  }
  return DEV_JWT_SECRET;
}

export function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET must be set in production. See .env.example.');
  }
  return DEV_REFRESH_SECRET;
}
