import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte key from JWT_ACCESS_SECRET (or a dedicated TOTP_KEY env var).
 * In production, use a proper KMS or HSM-backed key.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("Missing encryption key for TOTP");
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a TOTP secret for storage at rest.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 */
export function encryptTotpSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a TOTP secret from storage.
 * Expects the format: iv:authTag:ciphertext (all hex-encoded).
 */
export function decryptTotpSecret(encryptedValue: string): string {
  const key = getEncryptionKey();
  const parts = encryptedValue.split(":");

  // If value is not in encrypted format (legacy plain base32), return as-is
  if (parts.length !== 3) {
    return encryptedValue;
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
