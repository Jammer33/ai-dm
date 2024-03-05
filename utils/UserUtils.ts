import crypto from 'crypto';

export function generateUserToken() {
    return generateToken(7, 'u_');
}

export function generateResetToken() {
    return generateToken(16, 'rs_');
}

export function generateCampaignToken() {
    return generateToken(12, 'c_');
}

export function generateToken(length = 7, prefix = '') {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    let token = prefix;

    for (let i = 0; i < length; i++) {
        const randomValue = crypto.randomInt(charactersLength);
        token += characters.charAt(randomValue);
    }

    return token;
}