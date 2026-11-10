import { describe, expect, it } from 'vitest';
import { getTokenExpiresAt, getTokenLifetimeMs, isTokenExpired } from '@/lib/session';

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = (claims: object) => `${b64url({ alg: 'HS256' })}.${b64url(claims)}.signature`;

describe('session token helpers', () => {
  it('reads expiry and lifetime from the JWT payload', () => {
    const t = token({ iat: 1_000, exp: 8_200 });
    expect(getTokenExpiresAt(t)).toBe(8_200_000);
    expect(getTokenLifetimeMs(t)).toBe(7_200_000);
  });

  it('detects expired tokens', () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    const future = Math.floor(Date.now() / 1000) + 600;
    expect(isTokenExpired(token({ exp: past }))).toBe(true);
    expect(isTokenExpired(token({ exp: future }))).toBe(false);
  });

  it('is tolerant with malformed tokens', () => {
    expect(getTokenExpiresAt('not-a-jwt')).toBeNull();
    expect(getTokenLifetimeMs(token({ exp: 10 }))).toBeNull();
    expect(isTokenExpired('garbage')).toBe(false);
  });
});
