# @edge-memory/core

Reference SDK for the Edge Memory Protocol - an open standard for sharing AI memory across mobile applications.

## Installation

```bash
npm install @edge-memory/core
```

### Peer Dependencies

```bash
npm install expo-file-system expo-document-picker @react-native-async-storage/async-storage
```

## Quick Start

```typescript
import { createMemoryStore } from '@edge-memory/core';

// Create memory store
const memory = createMemoryStore({
  appId: 'com.yourcompany.yourapp', // Your app's reverse domain
  debug: true, // Enable logging
});

// Request access (shows platform-specific picker)
await memory.setup();

// Initialize
await memory.initialize();

// Write a memory
await memory.write({
  content: 'User prefers dark mode',
  type: 'preference',
  tags: ['ui', 'theme'],
});

// Read memories
const memories = await memory.read();
console.log(memories);
```

## API Reference

### `createMemoryStore(config)`

Creates a new memory store instance.

**Config:**
```typescript
{
  appId: string;              // Required: reverse domain notation
  filePath?: string;          // Optional: custom file path
  onSetupRequired?: () => Promise<void>;  // Optional: custom setup UI
  debug?: boolean;            // Optional: enable logging
  lockTimeout?: number;       // Optional: lock timeout in ms (default: 5000)
}
```

### `memory.setup()`

Requests access from user (platform-specific). Returns `Promise<boolean>`.

### `memory.initialize()`

Initializes the memory store. Must be called after setup.

### `memory.isReady()`

Checks if the store is ready to use. Returns `Promise<boolean>`.

### `memory.write(input)`

Writes a new memory entry.

**Input:**
```typescript
{
  content: string;            // Required: the memory content
  type?: string;              // Optional: memory type
  tags?: string[];            // Optional: tags for filtering
  meta?: Record<string, any>; // Optional: app-specific metadata
  emb?: number[];             // Optional: embedding vector
}
```

Returns: `Promise<EdgeMemoryEntry>`

### `memory.read(filter?)`

Reads memory entries with optional filtering.

**Filter:**
```typescript
{
  since?: number;    // Unix timestamp (ms)
  until?: number;    // Unix timestamp (ms)
  type?: string;     // Memory type
  tags?: string[];   // Filter by tags
  src?: string;      // Filter by source app
  limit?: number;    // Limit results
}
```

Returns: `Promise<EdgeMemoryEntry[]>`

### `memory.search(keyword, filter?)`

Searches memories by keyword (case-insensitive).

Returns: `Promise<EdgeMemoryEntry[]>`

### `memory.update(id, updates)`

Updates an existing memory entry.

Returns: `Promise<EdgeMemoryEntry>`

### `memory.delete(id)`

Deletes a memory entry.

Returns: `Promise<void>`

### `memory.stats()`

Gets statistics about stored memories.

Returns: `Promise<MemoryStats>`

### `memory.export()`

Exports all memories as JSON.

Returns: `Promise<string>`

### `memory.clear()`

Clears all memories (dangerous!).

Returns: `Promise<void>`

### `memory.onChange(listener)`

Subscribes to memory changes.

Returns: Unsubscribe function

## Types

### `EdgeMemoryEntry`

```typescript
{
  v: string;              // Protocol version
  id: string;             // UUID v4
  ts: number;             // Unix timestamp (ms)
  src: string;            // Source app
  content: string;        // Memory content
  type?: string;          // Memory type
  tags?: string[];        // Tags
  meta?: Record<string, any>;  // Metadata
  emb?: number[];         // Embedding vector
}
```

## Examples

### Basic Usage

```typescript
import { createMemoryStore } from '@edge-memory/core';

const memory = createMemoryStore({
  appId: 'com.example.chat',
});

await memory.setup();
await memory.initialize();

// Write
await memory.write({
  content: 'User mentioned meeting John on Friday',
  type: 'event',
  tags: ['calendar', 'person:john'],
});

// Read recent
const recent = await memory.read({
  since: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
});
```

### With Cactus LLM

```typescript
import { CactusLM } from 'cactus-react-native';
import { createMemoryStore } from '@edge-memory/core';

const memory = createMemoryStore({
  appId: 'com.example.chat',
});

const cactusLM = new CactusLM();

// Get relevant context from memory
const context = await memory.read({
  tags: ['preference', 'personal'],
  limit: 10,
});

// Include in prompt
const messages = [
  {
    role: 'system',
    content: `Context: ${context.map(m => m.content).join('; ')}`,
  },
  {
    role: 'user',
    content: userMessage,
  },
];

const result = await cactusLM.complete({ messages });
```

### Listening to Changes

```typescript
const unsubscribe = memory.onChange((event) => {
  console.log('Memory changed:', event.type, event.entry);
});

// Later: unsubscribe
unsubscribe();
```

## Platform-Specific Notes

### iOS

- Uses Files app with security-scoped bookmarks
- User must select EdgeMemory folder on first launch
- Folder can be in "On My iPhone" or "iCloud Drive"

### Android

- Uses standard Documents/EdgeMemory folder
- Automatically creates folder if it doesn't exist
- No user interaction needed (uses app's document directory)

## License

MIT
