const crypto = require('crypto');

const ALG = 'aes-256-gcm';
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;
const KEY_LEN = 32;

function getKey() {
  const raw = process.env.UPI_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-upi-encryption-key-change-in-production';
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string') return null;
  try {
    const key = getKey();
    const buf = Buffer.from(ciphertext, 'base64');
    if (buf.length < IV_LEN + AUTH_TAG_LEN) return null;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
    const enc = buf.subarray(IV_LEN + AUTH_TAG_LEN);
    const decipher = crypto.createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc) + decipher.final('utf8');
  } catch (e) {
    return null;
  }
}

module.exports = { encrypt, decrypt };
