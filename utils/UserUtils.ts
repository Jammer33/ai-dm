import crypto from 'crypto';

export function generateUserToken(length = 7) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let token = 'u_';

    for (let i = 0; i < length; i++) {
        const randomValue = crypto.randomInt(charactersLength);
        token += characters.charAt(randomValue);
    }

    return token;
}