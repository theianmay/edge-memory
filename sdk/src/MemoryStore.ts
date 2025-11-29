/**
 * Edge Memory Protocol - Core Memory Store
 */

import { FileLockManager, withLock } from './lock';
import {
    AccessDeniedError,
    CreateMemoryInput,
    EdgeMemoryConfig,
    EdgeMemoryEntry,
    EmbeddingProvider,
    LockManager,
    MemoryEvent,
    MemoryEventListener,
    MemoryFilter,
    MemoryStats,
    PlatformAccessHandler,
    SearchResult,
} from './types';
import { generateUUID, isVersionCompatible, validateAppId, validateEntry } from './validation';

const PROTOCOL_VERSION = '1.0';

/**
 * Core memory store implementation
 */
export class EdgeMemoryStore {
  private config: EdgeMemoryConfig;
  private platformHandler: PlatformAccessHandler;
  private lockManager?: LockManager;
  private filePath?: string;
  private listeners: MemoryEventListener[] = [];
  private embeddingProvider?: EmbeddingProvider;

  constructor(
    config: EdgeMemoryConfig,
    platformHandler: PlatformAccessHandler
  ) {
    validateAppId(config.appId);
    this.config = config;
    this.platformHandler = platformHandler;
  }

  /**
   * Initialize the memory store
   */
  async initialize(): Promise<void> {
    // Check if we have access
    const hasAccess = await this.platformHandler.hasAccess();
    
    if (!hasAccess) {
      if (this.config.onSetupRequired) {
        await this.config.onSetupRequired();
      } else {
        throw new AccessDeniedError(
          'Access to memory file not granted. Call setup() first.'
        );
      }
    }

    // Get file path
    this.filePath = this.config.filePath || await this.platformHandler.getFilePath();

    // Ensure directory exists
    const dirPath = this.filePath.substring(0, this.filePath.lastIndexOf('/'));
    await this.platformHandler.ensureDirectory(dirPath);

    // Create file if it doesn't exist
    const exists = await this.platformHandler.fileExists(this.filePath);
    if (!exists) {
      await this.platformHandler.writeFile(this.filePath, '');
    }

    // Initialize lock manager
    this.lockManager = new FileLockManager(
      this.filePath,
      {
        exists: (path) => this.platformHandler.fileExists(path),
        read: (path) => this.platformHandler.readFile(path),
        write: (path, content) => this.platformHandler.writeFile(path, content),
        delete: (path) => this.platformHandler.deleteFile(path),
      },
      this.config.lockTimeout
    );

    // Clean up any stale lock file from previous crashes
    const lockPath = `${this.filePath}.lock`;
    const lockExists = await this.platformHandler.fileExists(lockPath);
    if (lockExists) {
      console.warn('⚠️ [MemoryStore] Found stale lock file on init, removing...');
      await this.platformHandler.deleteFile(lockPath);
    }

    this.log('Initialized memory store at', this.filePath);
  }

  /**
   * Check if the store is ready to use
   */
  async isReady(): Promise<boolean> {
    return await this.platformHandler.hasAccess();
  }

  /**
   * Request access from user (platform-specific)
   */
  async setup(): Promise<boolean> {
    const granted = await this.platformHandler.requestAccess();
    if (granted) {
      await this.initialize();
    }
    return granted;
  }

  /**
   * Write a new memory entry
   */
  async write(input: CreateMemoryInput): Promise<EdgeMemoryEntry> {
    if (!this.filePath || !this.lockManager) {
      throw new Error('Memory store not initialized. Call initialize() first.');
    }

    // Create full entry
    const entry: EdgeMemoryEntry = {
      v: PROTOCOL_VERSION,
      id: generateUUID(),
      ts: input.ts || Date.now(),
      src: this.config.appId,
      content: input.content,
      type: input.type,
      tags: input.tags,
      meta: input.meta,
      emb: input.emb,
    };

    // Validate entry
    validateEntry(entry);

    // Write to file with lock
    await withLock(this.lockManager, async () => {
      const line = JSON.stringify(entry) + '\n';
      await this.platformHandler.appendFile(this.filePath!, line);
    });

    this.log('Wrote entry:', entry.id);

    // Notify listeners
    this.notifyListeners({
      type: 'write',
      entry,
      timestamp: Date.now(),
    });

    return entry;
  }

  /**
   * Read memory entries with optional filtering
   */
  async read(filter?: MemoryFilter): Promise<EdgeMemoryEntry[]> {
    if (!this.filePath) {
      throw new Error('Memory store not initialized. Call initialize() first.');
    }

    // Read entire file
    const content = await this.platformHandler.readFile(this.filePath);
    
    if (!content.trim()) {
      return [];
    }

    // Parse entries
    const lines = content.split('\n').filter(line => line.trim());
    const entries: EdgeMemoryEntry[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as EdgeMemoryEntry;
        
        // Validate and check version compatibility
        validateEntry(entry);
        if (!isVersionCompatible(entry.v, PROTOCOL_VERSION)) {
          this.log('Skipping incompatible version:', entry.v);
          continue;
        }

        // Apply filters
        if (filter) {
          if (filter.since && entry.ts < filter.since) continue;
          if (filter.until && entry.ts > filter.until) continue;
          if (filter.type && entry.type !== filter.type) continue;
          if (filter.src && entry.src !== filter.src) continue;
          if (filter.tags && filter.tags.length > 0) {
            const hasTag = filter.tags.some(tag => entry.tags?.includes(tag));
            if (!hasTag) continue;
          }
        }

        entries.push(entry);
      } catch (error) {
        this.log('Failed to parse entry:', line, error);
        // Skip invalid entries
      }
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.ts - a.ts);

    // Apply limit
    if (filter?.limit) {
      return entries.slice(0, filter.limit);
    }

    return entries;
  }

  /**
   * Search entries by keyword
   */
  async search(keyword: string, filter?: MemoryFilter): Promise<EdgeMemoryEntry[]> {
    const entries = await this.read(filter);
    const lowerKeyword = keyword.toLowerCase();
    
    return entries.filter(entry =>
      entry.content.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(
    query: string,
    k: number = 10,
    filter?: MemoryFilter
  ): Promise<SearchResult[]> {
    if (!this.embeddingProvider) {
      throw new Error('Embedding provider not configured');
    }

    // Generate query embedding
    const queryEmb = await this.embeddingProvider.embed(query);

    // Get all entries with embeddings
    const entries = await this.read(filter);
    const entriesWithEmb = entries.filter(e => e.emb && e.emb.length > 0);

    // Calculate similarities
    const results: SearchResult[] = entriesWithEmb.map(entry => ({
      entry,
      score: this.embeddingProvider!.similarity(queryEmb, entry.emb!),
    }));

    // Sort by score (highest first) and take top k
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  /**
   * Update an existing entry (creates new entry with same ID)
   */
  async update(id: string, updates: Partial<CreateMemoryInput>): Promise<EdgeMemoryEntry> {
    // Find existing entry
    const entries = await this.read();
    const existing = entries.find(e => e.id === id);

    if (!existing) {
      throw new Error(`Entry with id ${id} not found`);
    }

    // Create updated entry
    const updated: CreateMemoryInput = {
      ...existing,
      ...updates,
      ts: Date.now(), // New timestamp for update
    };

    // Write new entry (same ID, newer timestamp)
    return await this.write(updated);
  }

  /**
   * Delete an entry (rewrites file without the entry)
   */
  async delete(id: string): Promise<void> {
    if (!this.filePath || !this.lockManager) {
      throw new Error('Memory store not initialized. Call initialize() first.');
    }

    await withLock(this.lockManager, async () => {
      // Read all entries
      const entries = await this.read();
      
      // Filter out deleted entry
      const filtered = entries.filter(e => e.id !== id);

      if (filtered.length === entries.length) {
        throw new Error(`Entry with id ${id} not found`);
      }

      // Rewrite file
      const content = filtered
        .map(e => JSON.stringify(e))
        .join('\n') + (filtered.length > 0 ? '\n' : '');
      
      await this.platformHandler.writeFile(this.filePath!, content);
    });

    this.log('Deleted entry:', id);

    // Notify listeners
    this.notifyListeners({
      type: 'delete',
      entry: { id } as EdgeMemoryEntry, // Partial entry for delete event
      timestamp: Date.now(),
    });
  }

  /**
   * Get statistics about stored memories
   */
  async stats(): Promise<MemoryStats> {
    const entries = await this.read();

    const stats: MemoryStats = {
      totalEntries: entries.length,
      fileSize: 0, // TODO: Get actual file size
      byType: {},
      bySource: {},
    };

    if (entries.length > 0) {
      stats.oldestEntry = Math.min(...entries.map(e => e.ts));
      stats.newestEntry = Math.max(...entries.map(e => e.ts));

      // Count by type
      for (const entry of entries) {
        if (entry.type) {
          stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
        }
        stats.bySource[entry.src] = (stats.bySource[entry.src] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Export all memories as JSON
   */
  async export(): Promise<string> {
    const entries = await this.read();
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Clear all memories (dangerous!)
   */
  async clear(): Promise<void> {
    if (!this.filePath || !this.lockManager) {
      throw new Error('Memory store not initialized. Call initialize() first.');
    }

    await withLock(this.lockManager, async () => {
      await this.platformHandler.writeFile(this.filePath!, '');
    });

    this.log('Cleared all memories');
  }

  /**
   * Set embedding provider for semantic search
   */
  setEmbeddingProvider(provider: EmbeddingProvider): void {
    this.embeddingProvider = provider;
  }

  /**
   * Subscribe to memory changes
   */
  onChange(listener: MemoryEventListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of a change
   */
  private notifyListeners(event: MemoryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        this.log('Error in listener:', error);
      }
    }
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[EdgeMemory]', ...args);
    }
  }
}
