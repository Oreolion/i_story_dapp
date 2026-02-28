import { describe, it, expect } from "vitest";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateSalt,
  derivePinKey,
  generateDEK,
  wrapDEK,
  unwrapDEK,
  encryptData,
  decryptData,
  encryptString,
  decryptString,
  hashPin,
} from "@/lib/vault/crypto";

describe("Vault Crypto", () => {
  // --- Base64 Round-trips ---

  it("round-trips ArrayBuffer ↔ base64", () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const b64 = arrayBufferToBase64(original.buffer);
    const restored = new Uint8Array(base64ToArrayBuffer(b64));
    expect(restored).toEqual(original);
  });

  it("handles empty buffer", () => {
    const empty = new Uint8Array([]);
    const b64 = arrayBufferToBase64(empty.buffer);
    const restored = new Uint8Array(base64ToArrayBuffer(b64));
    expect(restored).toEqual(empty);
  });

  // --- Salt Generation ---

  it("generates 16-byte salt", () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.byteLength).toBe(16);
  });

  it("generates unique salts", () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(arrayBufferToBase64(salt1.buffer)).not.toBe(
      arrayBufferToBase64(salt2.buffer)
    );
  });

  // --- Key Derivation ---

  it("derives a CryptoKey from PIN + salt", async () => {
    const salt = generateSalt();
    const key = await derivePinKey("123456", salt);
    expect(key).toBeDefined();
    expect(key.type).toBe("secret");
    expect(key.algorithm).toMatchObject({ name: "AES-KW" });
  });

  // --- DEK Generation ---

  it("generates an AES-GCM-256 DEK", async () => {
    const dek = await generateDEK();
    expect(dek.type).toBe("secret");
    expect(dek.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect(dek.extractable).toBe(true);
  });

  // --- Key Wrapping ---

  it("wraps and unwraps DEK with KEK", async () => {
    const salt = generateSalt();
    const kek = await derivePinKey("654321", salt);
    const dek = await generateDEK();

    const wrapped = await wrapDEK(dek, kek);
    expect(wrapped.byteLength).toBeGreaterThan(0);

    const unwrapped = await unwrapDEK(wrapped, kek);
    expect(unwrapped.type).toBe("secret");
    expect(unwrapped.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });

    // Verify same key by encrypting with original, decrypting with unwrapped
    const plaintext = new TextEncoder().encode("test data");
    const { ciphertext, iv } = await encryptData(plaintext, dek);
    const decrypted = await decryptData(ciphertext, iv, unwrapped);
    expect(new TextDecoder().decode(decrypted)).toBe("test data");
  });

  // --- Data Encryption ---

  it("encrypts and decrypts ArrayBuffer data", async () => {
    const dek = await generateDEK();
    const plaintext = new TextEncoder().encode("Hello, Vault!");
    const { ciphertext, iv } = await encryptData(plaintext, dek);

    expect(ciphertext.byteLength).toBeGreaterThan(plaintext.byteLength);
    expect(iv.byteLength).toBe(12);

    const decrypted = await decryptData(ciphertext, iv, dek);
    expect(new TextDecoder().decode(decrypted)).toBe("Hello, Vault!");
  });

  it("uses unique IV per encryption", async () => {
    const dek = await generateDEK();
    const plaintext = new TextEncoder().encode("same data");
    const result1 = await encryptData(plaintext, dek);
    const result2 = await encryptData(plaintext, dek);

    expect(arrayBufferToBase64(result1.iv.buffer)).not.toBe(
      arrayBufferToBase64(result2.iv.buffer)
    );
  });

  // --- String Encryption ---

  it("encrypts and decrypts strings", async () => {
    const dek = await generateDEK();
    const message = "This is a journal entry with emoji: 📝";
    const { ciphertext, iv } = await encryptString(message, dek);

    expect(typeof ciphertext).toBe("string"); // base64
    expect(typeof iv).toBe("string"); // base64

    const decrypted = await decryptString(ciphertext, iv, dek);
    expect(decrypted).toBe(message);
  });

  // --- PIN Hash ---

  it("produces consistent hash for same PIN + salt", async () => {
    const salt = generateSalt();
    const hash1 = await hashPin("123456", salt);
    const hash2 = await hashPin("123456", salt);
    expect(hash1).toBe(hash2);
  });

  it("produces different hash for different PINs", async () => {
    const salt = generateSalt();
    const hash1 = await hashPin("123456", salt);
    const hash2 = await hashPin("654321", salt);
    expect(hash1).not.toBe(hash2);
  });
});
