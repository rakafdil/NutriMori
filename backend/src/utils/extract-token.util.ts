import type express from 'express';

export const extractTokenFromRequest = (
  req: express.Request,
): string | null => {
  // Try Authorization header first (Bearer ...)
  const authHeader =
    req.headers.authorization ??
    (req.headers as Record<string, string | undefined>)?.Authorization;
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1];
  }

  // Fallback to common cookie names (cookie-parser must be enabled)
  if (req.cookies) {
    return (
      req.cookies['sb-access-token'] ||
      req.cookies['sb:token'] ||
      req.cookies['access_token'] ||
      req.cookies['token'] ||
      null
    );
  }

  return null;
};
