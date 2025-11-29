# Edge Memory Protocol v1.0

## Overview

The Edge Memory Protocol (EMP) is an open standard for sharing AI memory across multiple applications on mobile devices. It enables local-first, privacy-preserving memory storage that any app can read from and write to with user consent.

## Design Principles

1. **Local-First**: All data remains on the device
2. **Privacy-Preserving**: User controls access and can view/edit/delete all data
3. **Interoperable**: Simple format that any app or LLM can parse
4. **Cross-App**: Multiple apps from different developers can share memory
5. **Platform-Native**: Uses OS-provided storage mechanisms
6. **Minimal Footprint**: Works on resource-constrained devices

## File Format

### Storage Format: JSONL (JSON Lines)

Each memory entry is a single line of JSON, making the format:
- **Append-friendly**: New entries are simply appended
- **Human-readable**: Can be inspected with any text editor
- **Parseable**: Standard JSON parsing, no special libraries needed
- **Resilient**: Corruption affects only individual lines, not entire file

### File Location

**Standard Paths:**

- **iOS**: `On My iPhone/EdgeMemory/memory.jsonl` or `iCloud Drive/EdgeMemory/memory.jsonl`
- **Android**: `/storage/emulated/0/Documents/EdgeMemory/memory.jsonl`

Apps access these locations through platform-specific APIs (Files app on iOS, Storage Access Framework on Android).

## Schema

### Memory Entry

```typescript
interface EdgeMemoryEntry {
  v: string;              // Protocol version (e.g., "1.0")
  id: string;             // Unique identifier (UUID v4)
  ts: number;             // Unix timestamp in milliseconds
  src: string;            // Source app (reverse domain notation)
  content: string;        // The memory content
  type?: string;          // Memory type (optional)
  tags?: string[];        // Tags for filtering (optional)
  meta?: Record<string, any>;  // App-specific metadata (optional)
  emb?: number[];         // Embedding vector (optional)
}
```

### Field Specifications

#### Required Fields

- **`v`** (string): Protocol version number
  - Format: `"MAJOR.MINOR"` (e.g., `"1.0"`)
  - Used for backward compatibility
  
- **`id`** (string): Unique identifier
  - Must be a valid UUID v4
  - Used for deduplication and updates
  
- **`ts`** (number): Timestamp
  - Unix timestamp in milliseconds
  - Used for ordering and filtering by time
  
- **`src`** (string): Source application
  - Reverse domain notation (e.g., `"com.company.appname"`)
  - Identifies which app created the entry
  
- **`content`** (string): Memory content
  - The actual memory text
  - UTF-8 encoded
  - No length limit (but keep reasonable for mobile)

#### Optional Fields

- **`type`** (string): Memory type
  - Suggested values: `"preference"`, `"fact"`, `"event"`, `"conversation"`, `"note"`
  - Apps can define custom types
  
- **`tags`** (string[]): Tags for categorization
  - Array of lowercase strings
  - Used for filtering and search
  - Examples: `["ui", "theme"]`, `["person:john", "calendar"]`
  
- **`meta`** (object): App-specific metadata
  - Arbitrary JSON object
  - Other apps should ignore unknown metadata
  - Examples: `{"priority": "high"}`, `{"location": "home"}`
  
- **`emb`** (number[]): Embedding vector
  - Array of floats representing semantic embedding
  - Used for vector similarity search
  - Dimension should be documented by the app

### Example Entries

```jsonl
{"v":"1.0","id":"550e8400-e29b-41d4-a716-446655440000","ts":1701234567890,"src":"com.example.chat","content":"User prefers dark mode","type":"preference","tags":["ui","theme"]}
{"v":"1.0","id":"6ba7b810-9dad-11d1-80b4-00c04fd430c8","ts":1701234568000,"src":"com.example.notes","content":"Meeting with John on Friday at 2pm","type":"event","tags":["calendar","person:john"],"meta":{"priority":"high"}}
{"v":"1.0","id":"6ba7b811-9dad-11d1-80b4-00c04fd430c8","ts":1701234569000,"src":"com.example.assistant","content":"User asked about weather in San Francisco","type":"conversation","emb":[0.123,0.456,0.789]}
```

## Access Patterns

### Read Operations

1. **Read All**: Load entire file and parse each line
2. **Filter by Time**: Read entries where `ts >= startTime && ts <= endTime`
3. **Filter by Tags**: Read entries where `tags` includes specified tag(s)
4. **Filter by Type**: Read entries where `type` matches specified type
5. **Search by Content**: Read entries where `content` contains keyword (case-insensitive)
6. **Semantic Search**: Read entries with similar `emb` vectors (if embeddings present)

### Write Operations

1. **Append**: Add new entry to end of file
2. **Update**: Append new entry with same `id` (newer `ts` takes precedence)
3. **Delete**: Append tombstone entry or rewrite file without deleted entry

### Concurrency Control

**File Locking**: Apps must implement file locking to prevent concurrent writes from corrupting the file.

**Recommended approach:**
1. Create lock file (`memory.jsonl.lock`) before writing
2. Write to file
3. Remove lock file
4. If lock file exists, wait with exponential backoff

**Alternative**: Use platform-specific atomic write operations

## Platform-Specific Implementation

### iOS

**Access Method**: Files app with security-scoped bookmarks

1. App requests user to select EdgeMemory folder via `UIDocumentPickerViewController`
2. User navigates to or creates `EdgeMemory` folder in Files app
3. App saves security-scoped bookmark for persistent access
4. Future launches use bookmark to access folder

**Required Capabilities:**
- `UISupportsDocumentBrowser` in Info.plist
- Document picker entitlements

**Code Example:**
```swift
// Request access to folder
let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.folder])
picker.delegate = self
present(picker, animated: true)

// Save bookmark
let bookmark = try url.bookmarkData(options: .minimalBookmark)
UserDefaults.standard.set(bookmark, forKey: "edgeMemoryBookmark")

// Restore access
var isStale = false
let url = try URL(resolvingBookmarkData: bookmark, bookmarkDataIsStale: &isStale)
let accessed = url.startAccessingSecurityScopedResource()
defer { url.stopAccessingSecurityScopedResource() }
```

### Android

**Access Method**: Storage Access Framework or standard Documents folder

**Option 1: Standard Location** (Android 10+)
```kotlin
val documentsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS)
val edgeMemoryDir = File(documentsDir, "EdgeMemory")
val memoryFile = File(edgeMemoryDir, "memory.jsonl")
```

**Option 2: Storage Access Framework**
```kotlin
// Request user to pick folder
val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
startActivityForResult(intent, REQUEST_CODE)

// Save URI for persistent access
contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
```

**Required Permissions:**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

## Security & Privacy

### User Control

1. **Explicit Consent**: User must explicitly grant each app access to the memory folder
2. **Transparency**: Users can view the memory file with any text editor
3. **Revocable**: Users can revoke access at any time through OS settings
4. **Deletable**: Users can delete individual entries or entire file

### Data Protection

1. **Local-Only**: Data never leaves the device (unless user uses cloud storage like iCloud)
2. **App Isolation**: Apps can only access memory if user grants permission
3. **Optional Encryption**: Apps can encrypt the `content` field using device keychain
4. **Audit Trail**: Each entry includes `src` field showing which app created it

### Encryption (Optional)

Apps may encrypt the `content` field:

```jsonl
{"v":"1.0","id":"...","ts":123,"src":"com.app","content":"encrypted:AES256:base64encodeddata"}
```

Encryption scheme:
- Prefix: `encrypted:ALGORITHM:`
- Key storage: OS keychain/keystore
- Shared key: Apps can share encryption key through secure channel if needed

## Versioning

### Protocol Version

Current version: `1.0`

Version format: `MAJOR.MINOR`
- **MAJOR**: Breaking changes (incompatible format)
- **MINOR**: Backward-compatible additions

### Backward Compatibility

Apps must handle entries with different protocol versions:
- Parse `v` field first
- Support older versions when possible
- Ignore unknown fields in newer versions

### Future Versions

Proposed features for future versions:
- Compression (gzip)
- Archival (split by time period)
- Conflict resolution strategies
- Real-time sync protocol
- Differential updates

## Best Practices

### For App Developers

1. **Validate entries**: Check schema before writing
2. **Use meaningful tags**: Help other apps filter relevant memories
3. **Respect privacy**: Don't write sensitive data without user consent
4. **Handle errors gracefully**: File may be locked or inaccessible
5. **Implement backoff**: Wait before retrying failed operations
6. **Document metadata**: If using custom `meta` fields, document them
7. **Test cross-app**: Verify your app works with other EMP-compatible apps

### For Users

1. **Review regularly**: Check what memories are being stored
2. **Delete old entries**: Keep file size manageable
3. **Backup**: Copy file to safe location periodically
4. **Control access**: Only grant permission to trusted apps

## Reference Implementation

See `@edge-memory/core` for a reference TypeScript/React Native implementation.

## License

This specification is released under CC0 1.0 Universal (Public Domain).

## Contributing

Proposals for future versions should be submitted as issues or pull requests to the Edge Memory Protocol repository.

## Changelog

### v1.0 (2025-11-28)
- Initial specification
- JSONL format
- Core schema definition
- Platform-specific access patterns
