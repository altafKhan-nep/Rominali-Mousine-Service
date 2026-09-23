import crypto from 'crypto';

// Random opaque token + SHA-256 hash. Only the hash is stored in the DB.
export const generateToken = () => crypto.randomBytes(32).toString('hex');

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
