# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-01

### Added
- Initial release of Edge Memory Protocol SDK
- Core `MemoryStore` with CRUD operations
- File-based locking mechanism with stale lock detection
- Expo platform handler for iOS/Android
- Keyword search functionality
- Memory filtering by type, tags, time range, source
- TypeScript type definitions
- Protocol v1.0 compliance

### Features
- Local-first memory storage using JSONL format
- Concurrent write protection with file locks
- Platform-agnostic design with pluggable handlers
- Event listener system for memory changes
- Memory statistics and export functionality

[1.0.0]: https://github.com/yourusername/edge-memory/releases/tag/v1.0.0
