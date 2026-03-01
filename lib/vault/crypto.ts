/**
 * Vault Encryption Module
 *
 * AES-256-GCM encryption with PBKDF2 key derivation.
 * PIN never leaves device — only used to derive KEK locally.
 */

// --- Encoding Helpers ---

export function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- Salt & IV Generation ---

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

// --- Key Derivation ---

/**
 * Derive a Key Encryption Key (KEK) from a 6-digit PIN using PBKDF2.
 * 100,000 iterations makes brute-force ~10ms/guess.
 */
export async function derivePinKey(
  pin: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    pinBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

// --- Data Encryption Key (DEK) ---

/**
 * Generate a random AES-256-GCM key for encrypting story data.
 */
export async function generateDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable — needed for key wrapping
    ["encrypt", "decrypt"]
  );
}

// --- Key Wrapping ---

/**
 * Wrap (encrypt) the DEK with the PIN-derived KEK using AES-KW.
 */
export async function wrapDEK(
  dek: CryptoKey,
  kek: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.wrapKey("raw", dek, kek, "AES-KW");
}

/**
 * Unwrap (decrypt) the DEK using the PIN-derived KEK.
 */
export async function unwrapDEK(
  wrappedDek: ArrayBuffer,
  kek: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    "raw",
    wrappedDek,
    kek,
    "AES-KW",
    { name: "AES-GCM", length: 256 },
    true, // extractable for re-wrapping on PIN change
    ["encrypt", "decrypt"]
  );
}

// --- Data Encryption/Decryption ---

export interface EncryptedPayload {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

/**
 * Encrypt arbitrary data with the DEK (AES-256-GCM).
 * Each call uses a fresh random 12-byte IV.
 */
export async function encryptData(
  plaintext: ArrayBuffer | BufferSource,
  dek: CryptoKey
): Promise<EncryptedPayload> {
  const iv = generateIV();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    dek,
    plaintext
  );
  return { ciphertext, iv };
}

/**
 * Decrypt data with the DEK (AES-256-GCM).
 */
export async function decryptData(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  dek: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    dek,
    ciphertext
  );
}

// --- PIN Verification Hash ---

/**
 * Quick SHA-256 hash for PIN verification (NOT used for crypto operations).
 * This allows checking if the entered PIN is correct without attempting
 * full key derivation + unwrapping on every attempt.
 */
export async function hashPin(
  pin: string,
  salt: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  const data = new Uint8Array([...encoder.encode(pin), ...salt]);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data as unknown as BufferSource);
  return arrayBufferToBase64(hashBuffer);
}

// --- String Encryption Helpers ---

/**
 * Encrypt a UTF-8 string and return base64-encoded ciphertext + IV.
 */
export async function encryptString(
  plaintext: string,
  dek: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const { ciphertext, iv } = await encryptData(data.buffer as ArrayBuffer, dek);
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a base64-encoded ciphertext back to a UTF-8 string.
 */
export async function decryptString(
  ciphertextB64: string,
  ivB64: string,
  dek: CryptoKey
): Promise<string> {
  const ciphertext = base64ToArrayBuffer(ciphertextB64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
  const plaintext = await decryptData(ciphertext, iv, dek);
  return new TextDecoder().decode(plaintext);
}
