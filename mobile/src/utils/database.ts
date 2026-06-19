/**
 * Local SQLite database for offline support.
 * Tables:
 *   - offline_sync_queue: queues POST/PUT/PATCH requests made while offline.
 *   - response_cache: caches GET responses for offline reading.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'wakhar.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Open (or create) the database and ensure tables exist.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT NOT NULL UNIQUE,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS response_cache (
      url TEXT PRIMARY KEY,
      response TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
  `);

  return db;
}

// ──────────────────────────────────────────────
// Offline Sync Queue helpers
// ──────────────────────────────────────────────

export interface QueuedRequest {
  id: number;
  idempotency_key: string;
  method: string;
  url: string;
  payload: string;
  created_at: string;
  status: string;
  retry_count: number;
  error_message: string | null;
}

/**
 * Add a request to the offline queue.
 */
export async function enqueueRequest(
  idempotencyKey: string,
  method: string,
  url: string,
  payload: object
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR IGNORE INTO offline_sync_queue (idempotency_key, method, url, payload, created_at, status, retry_count)
     VALUES (?, ?, ?, ?, ?, 'pending', 0)`,
    [idempotencyKey, method, url, JSON.stringify(payload), new Date().toISOString()]
  );
}

/**
 * Get all pending requests from the queue, ordered by creation time.
 */
export async function getPendingRequests(): Promise<QueuedRequest[]> {
  const database = await getDatabase();
  return await database.getAllAsync<QueuedRequest>(
    `SELECT * FROM offline_sync_queue WHERE status = 'pending' ORDER BY created_at ASC`
  );
}

/**
 * Remove a successfully synced request from the queue.
 */
export async function removeRequest(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM offline_sync_queue WHERE id = ?`, [id]);
}

/**
 * Mark a request as failed with an error message.
 */
export async function markRequestFailed(id: number, errorMessage: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE offline_sync_queue SET status = 'failed', error_message = ?, retry_count = retry_count + 1 WHERE id = ?`,
    [errorMessage, id]
  );
}

/**
 * Mark a request as syncing (in progress).
 */
export async function markRequestSyncing(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE offline_sync_queue SET status = 'syncing' WHERE id = ?`,
    [id]
  );
}

/**
 * Reset all 'syncing' requests back to 'pending' (e.g., app crashed mid-sync).
 */
export async function resetSyncingRequests(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE offline_sync_queue SET status = 'pending' WHERE status = 'syncing'`
  );
}

/**
 * Get the count of pending items in the queue.
 */
export async function getPendingCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM offline_sync_queue WHERE status = 'pending'`
  );
  return result?.count ?? 0;
}

// ──────────────────────────────────────────────
// Response Cache helpers
// ──────────────────────────────────────────────

/**
 * Cache a GET response for offline reading.
 */
export async function setCachedResponse(url: string, response: object): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO response_cache (url, response, cached_at) VALUES (?, ?, ?)`,
    [url, JSON.stringify(response), new Date().toISOString()]
  );
}

/**
 * Retrieve a cached GET response.
 */
export async function getCachedResponse(url: string): Promise<object | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ response: string }>(
    `SELECT response FROM response_cache WHERE url = ?`,
    [url]
  );
  if (row) {
    try {
      return JSON.parse(row.response);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear all cached responses (useful on logout or data refresh).
 */
export async function clearCache(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM response_cache`);
}
