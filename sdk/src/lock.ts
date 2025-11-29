/**
 * Edge Memory Protocol - File Locking
 */

import { LockManager, LockTimeoutError } from './types';

/**
 * Simple file-based lock manager
 */
export class FileLockManager implements LockManager {
  private lockPath: string;
  private lockTimeout: number;
  private fileOps: {
    exists: (path: string) => Promise<boolean>;
    write: (path: string, content: string) => Promise<void>;
    delete: (path: string) => Promise<void>;
  };

  constructor(
    filePath: string,
    fileOps: {
      exists: (path: string) => Promise<boolean>;
      write: (path: string, content: string) => Promise<void>;
      delete: (path: string) => Promise<void>;
    },
    timeout: number = 5000
  ) {
    this.lockPath = `${filePath}.lock`;
    this.lockTimeout = timeout;
    this.fileOps = fileOps;
  }

  async acquire(): Promise<void> {
    const startTime = Date.now();
    let attempt = 0;

    while (true) {
      // Check if lock file exists
      const locked = await this.isLocked();
      
      if (!locked) {
        // Try to create lock file
        try {
          await this.fileOps.write(this.lockPath, Date.now().toString());
          return; // Successfully acquired lock
        } catch (error) {
          // Another process might have created the lock file
          // Continue to next iteration
        }
      }

      // Check timeout
      if (Date.now() - startTime > this.lockTimeout) {
        throw new LockTimeoutError(
          `Failed to acquire lock after ${this.lockTimeout}ms`
        );
      }

      // Exponential backoff with jitter
      const backoff = Math.min(100 * Math.pow(2, attempt), 1000);
      const jitter = Math.random() * 50;
      await this.sleep(backoff + jitter);
      
      attempt++;
    }
  }

  async release(): Promise<void> {
    try {
      await this.fileOps.delete(this.lockPath);
    } catch (error) {
      // Lock file might not exist or already deleted
      // This is acceptable
    }
  }

  async isLocked(): Promise<boolean> {
    try {
      const exists = await this.fileOps.exists(this.lockPath);
      
      if (!exists) {
        return false;
      }

      // TODO: Check if lock is stale (older than timeout)
      // For now, we trust that locks are properly released
      return true;
    } catch (error) {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * In-memory lock manager for testing
 */
export class InMemoryLockManager implements LockManager {
  private locked: boolean = false;
  private lockTimeout: number;

  constructor(timeout: number = 5000) {
    this.lockTimeout = timeout;
  }

  async acquire(): Promise<void> {
    const startTime = Date.now();
    let attempt = 0;

    while (this.locked) {
      if (Date.now() - startTime > this.lockTimeout) {
        throw new LockTimeoutError(
          `Failed to acquire lock after ${this.lockTimeout}ms`
        );
      }

      const backoff = Math.min(100 * Math.pow(2, attempt), 1000);
      const jitter = Math.random() * 50;
      await this.sleep(backoff + jitter);
      
      attempt++;
    }

    this.locked = true;
  }

  async release(): Promise<void> {
    this.locked = false;
  }

  async isLocked(): Promise<boolean> {
    return this.locked;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Execute a function with lock protection
 */
export async function withLock<T>(
  lockManager: LockManager,
  fn: () => Promise<T>
): Promise<T> {
  await lockManager.acquire();
  try {
    return await fn();
  } finally {
    await lockManager.release();
  }
}
