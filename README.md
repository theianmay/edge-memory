# Edge Memory Protocol

An open standard for sharing AI memory across mobile applications.

> **Built for Arm64 Architecture** - Optimized for modern Arm-based mobile devices with on-device AI inference.

## Overview

The Edge Memory Protocol (EMP) enables multiple apps from different developers to share a common memory store on mobile devices. All data stays local on the device, giving users complete control over their AI memory.

## Project Structure

```
edge-memory/
├── spec/                    # Protocol specification
│   └── v1.0/
│       ├── specification.md # Full protocol documentation
│       ├── schema.json      # JSON Schema for validation
│       └── examples.jsonl   # Example memory entries
├── sdk/                     # Reference SDK implementation
│   ├── src/
│   │   ├── types.ts         # TypeScript type definitions
│   │   ├── validation.ts    # Entry validation
│   │   ├── lock.ts          # File locking
│   │   ├── MemoryStore.ts   # Core memory store
│   │   ├── platform/
│   │   │   └── expo.ts      # Expo/React Native platform handler
│   │   └── index.ts         # Public API
│   └── package.json
└── app/                     # Example application (coming soon)
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Read the Specification

Start with the [protocol specification](./spec/v1.0/specification.md) to understand the standard.

### 3. Use the SDK

```typescript
import { createMemoryStore } from './sdk/src';

const memory = createMemoryStore({
  appId: 'com.yourcompany.yourapp',
  debug: true,
});

// Initialize (requests user permission)
await memory.setup();
await memory.initialize();

// Write a memory
await memory.write({
  content: 'User prefers dark mode',
  type: 'preference',
  tags: ['ui', 'theme'],
});

// Read memories
const recent = await memory.read({
  since: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
});

console.log(recent);
```

## Key Features

- **Local-First**: All data stays on device
- **Cross-App**: Multiple apps can share the same memory
- **Privacy-Preserving**: User controls all access
- **Simple Format**: JSONL (JSON Lines) for easy parsing
- **Platform-Native**: Uses iOS Files app and Android storage
- **Open Standard**: Any developer can implement

## Platform Support

- **Architecture**: Arm64 (arm64-v8a) - optimized for modern mobile devices
- **iOS**: Via Files app with security-scoped bookmarks
- **Android**: Via standard Documents folder or Storage Access Framework
- **React Native**: Reference implementation provided (Expo SDK)
- **Native**: Implement the spec in Swift/Kotlin
- **AI Framework**: Cactus SDK for on-device inference (Qwen 3 - 0.6B)

## Documentation

- [Protocol Specification](./spec/v1.0/specification.md)
- [JSON Schema](./spec/v1.0/schema.json)
- [Example Entries](./spec/v1.0/examples.jsonl)

## Development

### Build Configuration

The project is configured to build for **Arm64 architecture** (arm64-v8a):

```json
// eas.json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "env": {
          "ANDROID_ABI_FILTERS": "arm64-v8a"
        }
      }
    }
  }
}
```

This ensures the APK runs on modern Arm-based Android devices and leverages Arm-optimized AI inference via Cactus SDK.

### Build SDK

```bash
cd sdk
npm install
npm run build
```

### Build Android APK

```bash
eas build --profile preview --platform android
```

### Run Example App

```bash
npm start
```

## Contributing

This is an open standard. Contributions welcome:

1. Protocol improvements (submit proposals)
2. SDK enhancements
3. Platform implementations (Swift, Kotlin, etc.)
4. Example applications
5. Documentation improvements

## License

- **Protocol Specification**: CC0 1.0 Universal (Public Domain)
- **Reference SDK**: MIT License

## Roadmap

- [x] Protocol specification v1.0
- [x] TypeScript/React Native SDK
- [ ] Example chat application
- [ ] Example notes application
- [ ] Swift SDK for native iOS
- [ ] Kotlin SDK for native Android
- [ ] Embedding/vector search support
- [ ] Encryption helpers
- [ ] Protocol v2.0 (compression, archival)
