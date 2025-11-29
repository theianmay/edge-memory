/**
 * Edge Memory Protocol SDK
 * 
 * An open standard for sharing AI memory across mobile applications
 */

export { FileLockManager, InMemoryLockManager, withLock } from './lock';
export { EdgeMemoryStore } from './MemoryStore';
export { createPlatformHandler } from './platform/expo';
export {
    generateUUID,
    isVersionCompatible, validateAppId, validateEntry
} from './validation';

export type {
    CreateMemoryInput, EdgeMemoryConfig, EdgeMemoryEntry, EmbeddingProvider, LockManager, MemoryEvent, MemoryEventListener, MemoryEventType, MemoryFilter, MemoryStats, PlatformAccessHandler, SearchResult
} from './types';

export {
    AccessDeniedError, LockTimeoutError, ValidationError
} from './types';

/**
 * Convenience function to create a configured memory store
 */
import { EdgeMemoryStore } from './MemoryStore';
import { createPlatformHandler } from './platform/expo';
import { EdgeMemoryConfig } from './types';

export function createMemoryStore(config: EdgeMemoryConfig): EdgeMemoryStore {
  const platformHandler = createPlatformHandler();
  return new EdgeMemoryStore(config, platformHandler);
}

/**
 * Protocol version
 */
export const PROTOCOL_VERSION = '1.0';
