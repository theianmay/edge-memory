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
    read: (path: string) => Promise<string>;
    write: (path: string, content: string) => Promise<void>;
    delete: (path: string) => Promise<void>;
  };

  constructor(
    filePath: string,
    fileOps: {
      exists: (path: string) => Promise<boolean>;
      read: (path: string) => Promise<string>;
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

    console.log('🔒 [Lock] Attempting to acquire:', this.lockPath);

    while (true) {
      // Check if lock file exists
      const locked = await this.isLocked();
      
      if (!locked) {
        // Try to create lock file
        try {
          await this.fileOps.write(this.lockPath, Date.now().toString());
          console.log('✅ [Lock] Acquired after', Date.now() - startTime, 'ms, attempts:', attempt);
          return; // Successfully acquired lock
        } catch (error) {
          // Another process might have created the lock file
          // Continue to next iteration
        }
      }

      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > this.lockTimeout) {
        console.error('❌ [Lock] Timeout after', elapsed, 'ms. Attempts:', attempt);
        throw new LockTimeoutError(
          `Failed to acquire lock after ${this.lockTimeout}ms`
        );
      }

      // Exponential backoff with jitter
      const backoff = Math.min(100 * Math.pow(2, attempt), 1000);
      const jitter = Math.random() * 50;
      if (attempt % 5 === 0) { // Log every 5 attempts
        console.log('⏳ [Lock] Waiting... attempt', attempt, 'elapsed:', elapsed, 'ms');
      }
      await this.sleep(backoff + jitter);
      
      attempt++;
    }
  }

  async release(): Promise<void> {
    try {
      await this.fileOps.delete(this.lockPath);
      console.log('🔓 [Lock] Released:', this.lockPath);
    } catch (error) {
      console.warn('⚠️ [Lock] Release failed (might be already deleted):', error);
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

      // Check if lock is stale (older than 2x timeout)
      try {
        const lockContent = await this.fileOps.read(this.lockPath);
        const lockTime = parseInt(lockContent, 10);
        
        // Handle invalid/empty lock files
        if (isNaN(lockTime) || lockTime === 0) {
          console.warn('⚠️ [Lock] Invalid/empty lock file detected. Content:', JSON.stringify(lockContent), '. Removing...');
          await this.fileOps.delete(this.lockPath);
          return false;
        }
        
        const age = Date.now() - lockTime;
        
        if (age > this.lockTimeout * 2) {
          console.warn('⚠️ [Lock] Stale lock detected (age:', age, 'ms). Removing...');
          await this.fileOps.delete(this.lockPath);
          return false;
        }
      } catch (error) {
        // Can't read lock file, assume it's valid
        console.warn('⚠️ [Lock] Cannot read lock file, assuming locked');
      }

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

    console.log(' [Lock] Attempting to acquire lock');

    while (this.locked) {
      const elapsed = Date.now() - startTime;
      if (elapsed > this.lockTimeout) {
        console.error(' [Lock] Timeout after', elapsed, 'ms. Attempts:', attempt);
        throw new LockTimeoutError(
          `Failed to acquire lock after ${this.lockTimeout}ms`
        );
      }

      // Exponential backoff with jitter
      const backoff = Math.min(100 * Math.pow(2, attempt), 1000);
      const jitter = Math.random() * 50;
      console.log(' [Lock] Waiting... attempt', attempt, 'backoff:', Math.round(backoff + jitter), 'ms');
      await this.sleep(backoff + jitter);
      
      attempt++;
    }

    console.log(' [Lock] Acquired after', Date.now() - startTime, 'ms');
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
