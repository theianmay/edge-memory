/**
 * Edge Memory Protocol v1.0 - Type Definitions
 */

/**
 * A single memory entry following the Edge Memory Protocol
 */
export interface EdgeMemoryEntry {
  /** Protocol version (e.g., "1.0") */
  v: string;
  
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Unix timestamp in milliseconds */
  ts: number;
  
  /** Source application in reverse domain notation */
  src: string;
  
  /** The memory content */
  content: string;
  
  /** Memory type for categorization (optional) */
  type?: string;
  
  /** Tags for filtering and search (optional) */
  tags?: string[];
  
  /** App-specific metadata (optional) */
  meta?: Record<string, any>;
  
  /** Embedding vector for semantic search (optional) */
  emb?: number[];
}

/**
 * Input for creating a new memory entry (without auto-generated fields)
 */
export type CreateMemoryInput = Omit<EdgeMemoryEntry, 'v' | 'id' | 'ts' | 'src'> & {
  /** Override default timestamp (optional) */
  ts?: number;
};

/**
 * Filter options for reading memories
 */
export interface MemoryFilter {
  /** Filter by timestamp range */
  since?: number;
  until?: number;
  
  /** Filter by memory type */
  type?: string;
  
  /** Filter by tags (entries must have at least one of these tags) */
  tags?: string[];
  
  /** Filter by source app */
  src?: string;
  
  /** Limit number of results */
  limit?: number;
}

/**
 * Configuration for EdgeMemory instance
 */
export interface EdgeMemoryConfig {
  /** Application identifier in reverse domain notation */
  appId: string;
  
  /** Custom file path (optional, overrides platform defaults) */
  filePath?: string;
  
  /** Callback when user needs to grant access */
  onSetupRequired?: () => Promise<void>;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Lock timeout in milliseconds (default: 5000) */
  lockTimeout?: number;
  
  /** Enable encryption for content field (optional) */
  encryption?: {
    enabled: boolean;
    key?: string;
  };
}

/**
 * Platform-specific access handler
 */
export interface PlatformAccessHandler {
  /** Get the path to the memory file */
  getFilePath(): Promise<string>;
  
  /** Check if access is already granted */
  hasAccess(): Promise<boolean>;
  
  /** Request access from user (shows platform-specific UI) */
  requestAccess(): Promise<boolean>;
  
  /** Read file contents */
  readFile(path: string): Promise<string>;
  
  /** Append to file */
  appendFile(path: string, content: string): Promise<void>;
  
  /** Write entire file (for updates/deletes) */
  writeFile(path: string, content: string): Promise<void>;
  
  /** Check if file exists */
  fileExists(path: string): Promise<boolean>;
  
  /** Create directory if it doesn't exist */
  ensureDirectory(path: string): Promise<void>;
}

/**
 * Lock manager for concurrent access control
 */
export interface LockManager {
  /** Acquire lock (waits if already locked) */
  acquire(): Promise<void>;
  
  /** Release lock */
  release(): Promise<void>;
  
  /** Check if currently locked */
  isLocked(): Promise<boolean>;
}

/**
 * Memory store statistics
 */
export interface MemoryStats {
  /** Total number of entries */
  totalEntries: number;
  
  /** File size in bytes */
  fileSize: number;
  
  /** Oldest entry timestamp */
  oldestEntry?: number;
  
  /** Newest entry timestamp */
  newestEntry?: number;
  
  /** Entries by type */
  byType: Record<string, number>;
  
  /** Entries by source app */
  bySource: Record<string, number>;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  entry: EdgeMemoryEntry;
  score: number;
}

/**
 * Embedding provider interface for semantic search
 */
export interface EmbeddingProvider {
  /** Generate embedding for text */
  embed(text: string): Promise<number[]>;
  
  /** Calculate similarity between two embeddings */
  similarity(a: number[], b: number[]): number;
}

/**
 * Event types for memory changes
 */
export type MemoryEventType = 'write' | 'delete' | 'update';

/**
 * Memory change event
 */
export interface MemoryEvent {
  type: MemoryEventType;
  entry: EdgeMemoryEntry;
  timestamp: number;
}

/**
 * Event listener callback
 */
export type MemoryEventListener = (event: MemoryEvent) => void;

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Lock timeout error
 */
export class LockTimeoutError extends Error {
  constructor(message: string = 'Failed to acquire lock within timeout') {
    super(message);
    this.name = 'LockTimeoutError';
  }
}

/**
 * Access denied error
 */
export class AccessDeniedError extends Error {
  constructor(message: string = 'Access to memory file denied') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}
