export const SESSION_EXPIRED_EVENT = 'dualis:session-expired';

// This is only a client-side expiry hint. The backend still verifies the JWT.
export function getTokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    if (typeof claims !== 'object' || claims === null || !('exp' in claims)) return null;
    const exp = claims.exp;
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const expiresAt = getTokenExpiresAt(token);
  return expiresAt !== null && Date.now() >= expiresAt;
}

let redirecting = false;

export function expireSession(): void {
  if (typeof window === 'undefined' || redirecting) return;
  redirecting = true;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  const keys = Object.keys(localStorage).filter((key) => key.includes('dualis'));
  keys.forEach((key) => localStorage.removeItem(key));
  window.location.replace('/login?expired=true');
}
