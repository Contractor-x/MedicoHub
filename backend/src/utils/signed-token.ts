import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

type TokenPayload = Record<string, unknown> & {
    purpose: string;
    email?: string;
    uid?: string;
    exp: number;
    iat: number;
    nonce: string;
};

const base64UrlEncode = (value: string) =>
    Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecode = (value: string) => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
};

const getSecret = () => process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'medicohub-dev-auth-secret';

export const signToken = (payload: Omit<TokenPayload, 'iat' | 'nonce'>, ttlSeconds: number) => {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + ttlSeconds,
        nonce: randomBytes(12).toString('hex')
    } as TokenPayload;

    const payloadPart = base64UrlEncode(JSON.stringify(fullPayload));
    const signature = createHmac('sha256', getSecret()).update(payloadPart).digest('base64');
    const signaturePart = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `${payloadPart}.${signaturePart}`;
};

export const verifyToken = <T extends Record<string, unknown>>(token: string, purpose: string) => {
    const [payloadPart, signaturePart] = token.split('.');
    if (!payloadPart || !signaturePart) return null;

    const expectedSignature = createHmac('sha256', getSecret())
        .update(payloadPart)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

    const a = Buffer.from(signaturePart);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return null;
    }

    try {
        const payload = JSON.parse(base64UrlDecode(payloadPart)) as TokenPayload;
        if (payload.purpose !== purpose) return null;
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) return null;
        return payload as T & TokenPayload;
    } catch {
        return null;
    }
};
