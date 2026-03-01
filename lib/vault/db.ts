/**
 * Vault IndexedDB Schema (Dexie.js)
 *
 * Three tables:
 *   stories   — encrypted story records
 *   vaultKeys — per-user vault key material
 *   syncQueue — pending cloud sync operations
 */

import Dexie, { type EntityTable } from "dexie";

// --- Record Types ---

export type SyncStatus = "local" | "pending" | "synced" | "error";

export interface LocalStoryRecord {
  localId: string;
  userId: string;
  /** Encrypted title (base64) */
  encrypted_title: string;
  title_iv: string;
  /** Encrypted content (base64) */
  encrypted_content: string;
  content_iv: string;
  /** Encrypted audio blob (base64), optional */
  encrypted_audio?: string;
  audio_iv?: string;
  /** Encrypted metadata JSON (base64) — mood, tags, etc. */
  encrypted_metadata?: string;
  metadata_iv?: string;
  /** SHA-256 hash of plaintext for integrity check */
  checksum: string;
  /** Cloud story ID after sync */
  cloud_id?: string;
  /** Sync state */
  sync_status: SyncStatus;
  /** Whether story is public */
  is_public: boolean;
  /** User-selected story date */
  story_date: string;
  created_at: string;
  updated_at: string;
}

export interface VaultKeyRecord {
  userId: string;
  /** PBKDF2 salt (base64) */
  salt: string;
  /** AES-KW wrapped DEK (base64) */
  wrapped_dek: string;
  /** SHA-256 PIN hash for quick verification */
  pin_hash: string;
  created_at: string;
}

export interface SyncQueueRecord {
  id?: number; // Auto-incremented
  storyLocalId: string;
  userId: string;
  action: "upload" | "update" | "delete";
  status: "pending" | "processing" | "failed";
  retryCount: number;
  lastAttempt?: string;
  error?: string;
  created_at: string;
}

// --- Database Class ---

class VaultDatabase extends Dexie {
  stories!: EntityTable<LocalStoryRecord, "localId">;
  vaultKeys!: EntityTable<VaultKeyRecord, "userId">;
  syncQueue!: EntityTable<SyncQueueRecord, "id">;

  constructor() {
    super("estory-vault");

    this.version(1).stores({
      stories: "localId, userId, sync_status, updated_at, cloud_id",
      vaultKeys: "userId",
      syncQueue: "++id, storyLocalId, userId, status",
    });
  }
}

// Singleton instance
let _db: VaultDatabase | null = null;

export function getVaultDb(): VaultDatabase {
  if (!_db) {
    _db = new VaultDatabase();
  }
  return _db;
}

/**
 * Reset the database singleton (useful for tests).
 */
export async function resetVaultDb(): Promise<void> {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export type { VaultDatabase };
