# EMP Chat - Edge Memory Protocol Demo App

A demonstration chat application showcasing the Edge Memory Protocol with Cactus LLM integration.

## Features

### 🧠 Memory-Enabled Chat
- **Persistent Context**: Conversations are remembered across sessions
- **Smart Context Retrieval**: Relevant memories are automatically included in prompts
- **Preference Learning**: Automatically detects and stores user preferences
- **Fact Extraction**: Captures important information about the user

### 💬 Chat Interface
- Clean, modern UI with message bubbles
- Real-time memory statistics in header
- Auto-scrolling message list
- Keyboard-aware input

### 📚 Memory Viewer
- Browse all stored memories
- Filter by type (preference, fact, conversation)
- View metadata and tags
- Delete individual memories
- Export memories as JSON

### 🤖 Cactus Integration
- Local LLM inference (no cloud required)
- Automatic model download
- Progress tracking
- Context-aware responses using memory

## How It Works

### 1. Memory Extraction
The app automatically extracts memories from conversations:

```typescript
// Detects preferences
"I prefer dark mode" → Stored as preference

// Detects facts
"My name is John" → Stored as fact

// Stores all conversations
Every message → Stored as conversation context
```

### 2. Context Retrieval
Before sending to Cactus, the app:
1. Gets recent memories (last 7 days)
2. Gets user preferences
3. Searches for relevant memories based on user input
4. Combines and deduplicates context

### 3. Cactus Integration
```typescript
const context = await getRelevantContext(userMessage);

const result = await cactusLM.complete({
  messages: [
    { 
      role: 'system', 
      content: `Context: ${context}` 
    },
    { role: 'user', content: userMessage }
  ]
});
```

## Usage

### First Launch
1. App requests permission to access memory folder
2. Cactus model downloads (if not already present)
3. Welcome message appears

### Chatting
1. Type a message in the input field
2. App retrieves relevant context from memory
3. Message sent to Cactus with context
4. Response displayed
5. Memories automatically extracted and stored

### Viewing Memories
1. Tap "Memories" tab
2. See all stored memories
3. Filter by type
4. Delete or export as needed

## Memory Types

### Preference
User preferences and settings
- Example: "User prefers concise responses"
- Tags: `preference`, `conversation`

### Fact
Facts about the user
- Example: "User lives in San Francisco"
- Tags: `personal`, `location`

### Conversation
General conversation context
- Example: "User asked about weather"
- Tags: `chat`

### Event
Calendar events and reminders
- Example: "Meeting with John on Friday"
- Tags: `calendar`, `person:john`

## Cross-App Sharing

This app uses the Edge Memory Protocol, which means:

1. **Other apps can read these memories** (with user permission)
2. **This app can read memories from other apps**
3. **All data stays local** on the device
4. **User has full control** over what's stored

### Example Cross-App Scenario

**EMP Chat writes:**
```json
{
  "content": "User mentioned meeting John on Friday",
  "type": "event",
  "tags": ["calendar", "person:john"]
}
```

**Notes App reads:**
- Sees the meeting information
- Can create a reminder
- Can look up John's contact info

**Assistant App reads:**
- Knows about the meeting
- Can provide context-aware help
- Can suggest preparation tasks

## File Structure

```
app/
├── index.tsx          # Main chat interface
├── memories.tsx       # Memory viewer
├── _layout.tsx        # Tab navigation
└── README.md          # This file
```

## Technical Details

### Memory Storage
- **Format**: JSONL (JSON Lines)
- **Location**: 
  - iOS: User-selected folder via Files app
  - Android: `Documents/EdgeMemory/memory.jsonl`
- **Concurrency**: File locking prevents corruption

### Memory Schema
```typescript
{
  v: "1.0",              // Protocol version
  id: "uuid",            // Unique ID
  ts: 1234567890,        // Timestamp
  src: "com.example.empchat",  // Source app
  content: "Memory text",
  type: "preference",
  tags: ["ui", "theme"],
  meta: { key: "value" }
}
```

### Context Strategy
1. **Recency**: Last 7 days (5 memories)
2. **Preferences**: Top 3 preferences
3. **Relevance**: Search results (2 memories)
4. **Deduplication**: Remove duplicates by ID

## Demo Scenarios

### Scenario 1: Learning Preferences
```
User: "I prefer short, concise answers"
→ Stored as preference

User: "What's the weather?"
→ AI uses preference to give brief response
```

### Scenario 2: Remembering Facts
```
User: "My name is Alice"
→ Stored as fact

[Later session]
User: "What's my name?"
→ AI recalls: "Your name is Alice"
```

### Scenario 3: Context Continuity
```
User: "I'm planning a trip to Paris"
→ Stored as conversation

[Days later]
User: "What should I pack?"
→ AI knows about Paris trip from memory
```

## Limitations

### Current Implementation
- Simple keyword-based memory extraction
- No semantic search (embeddings not implemented yet)
- Manual memory management (no auto-cleanup)
- Basic heuristics for memory classification

### Future Enhancements
- Semantic search with embeddings
- Automatic memory importance scoring
- Memory consolidation and summarization
- Multi-modal memories (images, audio)
- Encryption support

## Privacy & Security

### What's Stored
- User messages (with consent)
- Detected preferences
- Conversation context
- Facts mentioned by user

### What's NOT Stored
- Passwords or sensitive data
- Full conversation transcripts (only summaries)
- Data from other apps (unless explicitly shared)

### User Control
- View all memories anytime
- Delete individual memories
- Clear all memories
- Export memories as JSON
- Revoke app access to memory folder

## Development

### Running the App
```bash
npm start
```

### Testing Memory Sharing
1. Build this app
2. Create a second app using Edge Memory SDK
3. Both apps use same memory folder
4. Observe cross-app memory sharing

### Debugging
Enable debug mode in memory store:
```typescript
const memory = createMemoryStore({
  appId: 'com.example.empchat',
  debug: true,  // Logs all operations
});
```

## License

MIT License - See main project LICENSE file
