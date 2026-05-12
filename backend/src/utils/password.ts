import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const hashBuffer = Buffer.from(hash, 'hex');
    const derived = scryptSync(password, salt, hashBuffer.length);
    return timingSafeEqual(hashBuffer, derived);
};
