# Edge Memory Protocol - Production Tasks

**Path:** Full Production (Option A)  
**Focus:** Android testing (iOS deferred until device available)  
**Goal:** Thoroughly vet SDK before v1.0.0 release

---

## 🎉 Major Milestone Achieved!

**Android Implementation is Fully Functional** ✅

The Edge Memory Protocol SDK now successfully:
- ✅ Creates `memory.jsonl` in user-selected shared folder via SAF
- ✅ Implements proper file locking with `memory.jsonl.lock` files
- ✅ All CRUD operations working (read, write, delete)
- ✅ Cross-app file sharing capability via Storage Access Framework
- ✅ Files accessible via Android Files app
- ✅ Lock files create and delete without errors
- ✅ All 3 memory types writing successfully

**Next Focus:** Testing, documentation, and beta release preparation

---

## Recent Progress ✅

### Completed Work
- [x] **Major Android Platform Refactor** - Migrated to StorageAccessFramework (SAF)
  - Replaced deprecated DocumentPicker with Directory.pickDirectoryAsync()
  - Implemented SAF-specific file operations (read, write, delete, exists)
  - Added content URI handling for Android
  - Added file URI tracking for proper deletion
  - Implemented file existence checking via directory listing

- [x] **Fixed Lock File Issues** - Lock mechanism fully functional
  - Lock files now create with correct extension (memory.jsonl.lock)
  - Lock files delete successfully without errors
  - URI tracking properly maps creation to deletion
  - All memory writes completing successfully (3/3 types)
  - File locking acquire and release working properly

- [x] **Android SAF Implementation Complete**
  - Cross-app file sharing via Storage Access Framework working
  - memory.jsonl file created in user-selected shared folder
  - File accessible via Files app on Android device
  - All CRUD operations (read/write/delete) functional
  - Ready for cross-app memory sharing

### Known Issues 🐛
- [ ] **Minor logging artifact** - Path display shows extra character in logs
  - Shows `primary%3AAEdgeMemory` in some logs (extra 'A')
  - Non-critical: Actual file operations succeed
  - Display issue only, not affecting functionality
- [ ] **Duplicate .txt files** - May be resolved with lock file fix
  - Need to verify if still occurring
  - Was potentially related to lock file creation issue

---

## Phase 1: Testing Infrastructure

### Setup
- [ ] Install Jest dependencies
  ```bash
  cd sdk
  npm install --save-dev jest @types/jest ts-jest
  ```
- [ ] Create `jest.config.js`
- [ ] Create `__tests__` directory structure
- [ ] Add test scripts to package.json
- [ ] Verify tests run: `npm test`

---

## Phase 1.5: Android SAF Verification ✅ (Mostly Complete)

### File Operations - VERIFIED ✅
- [x] Create file - verified correct URI and no duplicates
- [x] Write to file - verified content is written
- [x] Read from file - verified content is correct
- [x] Delete file - verified file is deleted successfully
- [x] Create lock file - verified created with .lock extension
- [x] Delete lock file - verified deleted without error

### Remaining Verification
- [ ] Verify duplicate .txt files no longer appear
- [ ] Test on fresh install to confirm clean file creation
- [ ] Verify logging artifact doesn't affect functionality

---

## Phase 2: Unit Tests

### Platform Handler Tests (`__tests__/platform/expo.test.ts`) - NEW
- [ ] Test Android SAF file operations
  - [ ] Test `writeFile()` with content URI
  - [ ] Test `readFile()` with content URI
  - [ ] Test `deleteFile()` with content URI
  - [ ] Test `fileExists()` with content URI
  - [ ] Test file URI tracking in `createdFileUris` map
- [ ] Test iOS file operations
  - [ ] Test `writeFile()` with regular path
  - [ ] Test `readFile()` with regular path
  - [ ] Test `deleteFile()` with regular path
- [ ] Test directory operations
  - [ ] Test `ensureDirectory()` skips content URIs
  - [ ] Test `ensureDirectory()` creates regular directories
- [ ] Test access methods
  - [ ] Test `requestAccess()` for Android
  - [ ] Test `requestAccess()` for iOS
  - [ ] Test `hasAccess()` bookmark validation

### Validation Tests (`__tests__/validation.test.ts`)
- [ ] Test `generateUUID()` - returns valid UUID v4
- [ ] Test `validateEntry()` - accepts valid entries
- [ ] Test `validateEntry()` - rejects invalid entries (missing fields, wrong types)
- [ ] Test `validateAppId()` - accepts valid reverse domain notation
- [ ] Test `validateAppId()` - rejects invalid app IDs
- [ ] Test `isVersionCompatible()` - handles version matching correctly
- [ ] Test edge cases (empty strings, null, undefined)

### MemoryStore Tests (`__tests__/MemoryStore.test.ts`)
**Setup:**
- [ ] Create mock file system implementation
- [ ] Create test helper to initialize MemoryStore with mocks

**CRUD Operations:**
- [ ] Test `write()` - creates valid entry
- [ ] Test `write()` - generates UUID and timestamp
- [ ] Test `write()` - appends to file correctly
- [ ] Test `write()` - triggers event listeners
- [ ] Test `read()` - returns all entries
- [ ] Test `read()` - returns empty array for empty file
- [ ] Test `read()` - parses JSONL correctly
- [ ] Test `update()` - creates new entry with same ID
- [ ] Test `update()` - preserves original fields when updating
- [ ] Test `delete()` - removes entry from file
- [ ] Test `delete()` - rewrites file without deleted entry

**Filtering:**
- [ ] Test `read({ type: 'preference' })` - filters by type
- [ ] Test `read({ tags: ['ui'] })` - filters by tags
- [ ] Test `read({ since: timestamp })` - filters by time range
- [ ] Test `read({ until: timestamp })` - filters by end time
- [ ] Test `read({ src: 'com.app' })` - filters by source app
- [ ] Test `read({ limit: 10 })` - limits results
- [ ] Test combined filters

**Search:**
- [ ] Test `search('keyword')` - finds matching entries
- [ ] Test `search()` - case insensitive
- [ ] Test `search()` - returns empty for no matches
- [ ] Test `search()` with filters

**Statistics:**
- [ ] Test `getStats()` - returns correct counts
- [ ] Test `getStats()` - calculates size correctly

**Export:**
- [ ] Test `exportJSON()` - returns valid JSON
- [ ] Test `exportJSON()` - includes all entries

### File Locking Tests (`__tests__/lock.test.ts`)
- [ ] Test `acquire()` - creates lock file
- [ ] Test `acquire()` - waits if lock exists
- [ ] Test `acquire()` - times out after max wait
- [ ] Test `acquire()` - uses exponential backoff
- [ ] Test `release()` - deletes lock file
- [ ] Test `release()` - handles already deleted lock
- [ ] Test `release()` - handles file not found error (Android SAF)
- [ ] Test `isLocked()` - detects existing lock
- [ ] Test `isLocked()` - returns false for no lock
- [ ] Test stale lock detection - removes old locks
- [ ] Test stale lock detection - handles invalid lock content
- [ ] Test stale lock detection - handles empty lock files
- [ ] Test concurrent acquire attempts (simulated)
- [ ] Test lock file URI tracking on Android (content URIs)

### Edge Case Tests (`__tests__/edge-cases.test.ts`)
- [ ] Test empty file handling
- [ ] Test corrupted JSONL (invalid JSON on line)
- [ ] Test partial line at end of file
- [ ] Test file with only whitespace
- [ ] Test very long content strings
- [ ] Test special characters in content
- [ ] Test Unicode/emoji in content
- [ ] Test entries with missing optional fields
- [ ] Test entries with extra unknown fields
- [ ] Test duplicate IDs (newer timestamp wins)

### Error Handling Tests (`__tests__/error-handling.test.ts`)
- [ ] Test file read errors
- [ ] Test file write errors
- [ ] Test permission denied errors
- [ ] Test disk full simulation
- [ ] Test invalid file path
- [ ] Test uninitialized store operations
- [ ] Test operations during lock timeout

**Target:** 70%+ code coverage

---

## Phase 3: Android Device Testing

### Test Devices
- [ ] Primary device: [Your device model, Android version]
- [ ] Secondary device (if available): [Model, version]
- [ ] Different manufacturer (if available)

### Fresh Install Testing (Updated for SAF)
- [ ] Install demo app on clean device
- [ ] First launch - request directory access
- [ ] Use Directory.pickDirectoryAsync() to select/create EdgeMemory folder
- [ ] Grant permission via SAF picker
- [ ] Verify content URI is saved to AsyncStorage
- [ ] Verify memory.jsonl file created with correct URI
- [ ] Check for duplicate files (.txt files)
- [ ] Write first memory
- [ ] Read memory back
- [ ] Verify persistence after app restart
- [ ] Verify bookmark URI persists across restarts

### Permission Testing
- [ ] Deny file access - app handles gracefully
- [ ] Grant access after denial
- [ ] Revoke permission after granting
- [ ] Re-grant permission
- [ ] Test with scoped storage (Android 10+)

### Lifecycle Testing
- [ ] Write memory, background app, foreground - memory persists
- [ ] Write memory, kill app, restart - memory persists
- [ ] Write memory, device reboot - memory persists
- [ ] Multiple app launches in succession
- [ ] App in background for extended period

### Crash Recovery Testing
- [ ] Force kill during write operation
- [ ] Verify stale lock cleaned up on restart
- [ ] Verify no data corruption
- [ ] Force kill during read operation
- [ ] Verify app recovers gracefully

### Storage Scenarios
- [ ] Normal storage - all operations work
- [ ] Low storage warning - writes still succeed
- [ ] Very low storage - graceful degradation
- [ ] External storage (SD card) if applicable
- [ ] Internal storage only

### File System Testing (Updated for SAF)
- [ ] Verify file is accessed via content URI (not direct path)
- [ ] Check that content URI format is correct
- [ ] Manually edit file via Files app - app handles gracefully
- [ ] Delete file manually via Files app - app recreates
- [ ] Corrupt file manually - app handles error
- [ ] Move EdgeMemory folder - test if bookmark URI still works
- [ ] Verify no duplicate .txt files are created
- [ ] Check actual file in Files app matches expected name (memory.jsonl)

### Performance on Device
- [ ] Write 10 memories - measure time
- [ ] Write 100 memories - measure time
- [ ] Read 100 memories - measure time
- [ ] Search 100 memories - measure time
- [ ] App responsiveness during operations
- [ ] Memory usage monitoring
- [ ] Battery impact (if measurable)

---

## Phase 4: Stress Testing

### Rapid Operations
- [ ] 100 sequential writes - no errors
- [ ] 1000 sequential writes - no errors
- [ ] Rapid read/write alternation
- [ ] Multiple filters in quick succession
- [ ] Rapid search queries

### Concurrent Access Simulation
- [ ] Create test with multiple MemoryStore instances
- [ ] Simultaneous writes from different instances
- [ ] Verify file locking prevents corruption
- [ ] Verify all writes eventually succeed
- [ ] Check for deadlocks

### Large File Testing
- [ ] Generate 1,000 entries (~1MB)
  - [ ] Write performance acceptable
  - [ ] Read performance acceptable
  - [ ] Search performance acceptable
  - [ ] No memory leaks
- [ ] Generate 10,000 entries (~10MB)
  - [ ] Write performance acceptable
  - [ ] Read performance acceptable
  - [ ] Filter performance acceptable
  - [ ] Memory usage reasonable
- [ ] Generate 100,000 entries (~100MB)
  - [ ] App doesn't crash
  - [ ] Operations complete (even if slow)
  - [ ] Document performance characteristics

### Memory Leak Testing
- [ ] Run 1000 write operations
- [ ] Monitor memory usage over time
- [ ] Verify memory is released
- [ ] Run 1000 read operations
- [ ] Verify no accumulation

### Error Recovery
- [ ] Simulate disk full during write
  - [ ] Error thrown correctly
  - [ ] No partial writes
  - [ ] App recovers
- [ ] Corrupt file during operation
  - [ ] Error detected
  - [ ] Helpful error message
  - [ ] Recovery path available
- [ ] Delete file during operation
  - [ ] Error handled gracefully
  - [ ] App can reinitialize
- [ ] Lock file stuck (manual creation)
  - [ ] Stale lock detected
  - [ ] Lock removed
  - [ ] Operations resume

---

## Phase 5: Performance Benchmarking

### Establish Baselines (Updated for SAF)
- [ ] Read 10 entries - target: <50ms (may be slower with SAF)
- [ ] Read 100 entries - target: <200ms (may be slower with SAF)
- [ ] Read 1000 entries - target: <1s (may be slower with SAF)
- [ ] Write single entry - target: <100ms (may be slower with SAF)
- [ ] Search 100 entries - target: <200ms
- [ ] Search 1000 entries - target: <500ms
- [ ] Filter 1000 entries - target: <300ms
- [ ] Lock acquire time - currently ~444ms (investigate if this is normal)

### Memory Usage
- [ ] Baseline app memory usage
- [ ] Memory after loading 100 entries
- [ ] Memory after loading 1000 entries
- [ ] Memory after 1000 operations
- [ ] Peak memory usage
- [ ] Check for memory leaks in `createdFileUris` map

### Document Results
- [ ] Create BENCHMARKS.md
- [ ] Include device specs
- [ ] Include test methodology
- [ ] Include actual measurements
- [ ] Note SAF-specific performance characteristics
- [ ] Compare SAF vs direct file access (if possible)
- [ ] Note any performance issues

---

## Phase 6: Documentation Improvements

### API Reference
- [ ] Document `createMemoryStore()` - all options
- [ ] Document `setup()` - behavior, errors
- [ ] Document `initialize()` - behavior, errors
- [ ] Document `write()` - parameters, return, errors
- [ ] Document `read()` - all filter options, examples
- [ ] Document `search()` - behavior, performance notes
- [ ] Document `update()` - behavior, edge cases
- [ ] Document `delete()` - behavior, warnings
- [ ] Document `getStats()` - return type
- [ ] Document `exportJSON()` - use cases
- [ ] Document event listeners - types, usage
- [ ] Document all error types and when they're thrown

### Troubleshooting Guide (Updated for SAF)
- [ ] "Permission denied" - causes and solutions
- [ ] "Lock timeout" - causes and solutions (note 444ms lock acquire time)
- [ ] "File not found" - causes and solutions (especially for content URIs)
- [ ] "File could not be deleted" - SAF-specific deletion issues
- [ ] "Invalid entry" - causes and solutions
- [ ] "Corrupted file" - recovery steps
- [ ] Performance issues - optimization tips
- [ ] Platform-specific issues (Android SAF)
- [ ] Content URI vs file path differences
- [ ] Duplicate .txt files issue
- [ ] Common integration mistakes

### Best Practices Guide
- [ ] When to write memories (not too frequently)
- [ ] How to structure tags (conventions)
- [ ] How to structure types (conventions)
- [ ] Content length recommendations
- [ ] Performance optimization tips
- [ ] Error handling patterns
- [ ] Testing your integration
- [ ] Debugging tips

### Migration Guide
- [ ] How to handle schema changes
- [ ] Backward compatibility strategy
- [ ] Upgrading from beta to v1.0
- [ ] Data migration tools/scripts

### Code Examples
- [ ] Minimal integration example
- [ ] Error handling example
- [ ] Filter usage examples
- [ ] Search usage examples
- [ ] Event listener examples
- [ ] Performance optimization example

---

## Phase 7: Example Projects

### Minimal Example
- [ ] Create `examples/minimal/` directory
- [ ] Bare minimum integration
- [ ] Single screen, basic functionality
- [ ] Well-commented code
- [ ] README with setup instructions

### Polished Chat Demo
- [ ] Move current demo to `examples/chat-app/`
- [ ] Clean up code
- [ ] Add comments
- [ ] Improve error handling
- [ ] Add loading states
- [ ] Polish UI
- [ ] README with features list

### Notes App Example
- [ ] Create `examples/notes-app/`
- [ ] Simple note-taking app
- [ ] Demonstrates different memory types
- [ ] Shows tag usage
- [ ] Shows search functionality
- [ ] README with setup

### Error Handling Example
- [ ] Create `examples/error-handling/`
- [ ] Demonstrates all error scenarios
- [ ] Shows recovery patterns
- [ ] Shows user-friendly error messages
- [ ] README explaining patterns

---

## Phase 8: Error Message Review

### Review All Error Messages
- [ ] List all error messages in codebase
- [ ] Check each for clarity
- [ ] Check each for actionability
- [ ] Add suggestions where possible
- [ ] Ensure consistent formatting
- [ ] Add error codes (optional)

### Specific Errors to Review
- [ ] Lock timeout error - suggest solutions
- [ ] Permission denied - suggest solutions
- [ ] File not found - suggest solutions
- [ ] Invalid entry - show what's invalid
- [ ] Corrupted file - suggest recovery
- [ ] Disk full - suggest cleanup
- [ ] Uninitialized store - suggest fix

---

## Phase 9: Beta Release Preparation

### Pre-Beta Checklist
- [ ] All unit tests passing
- [ ] 70%+ code coverage achieved
- [ ] Android testing complete
- [ ] No known critical bugs
- [ ] Documentation complete
- [ ] Examples working
- [ ] CHANGELOG.md updated for beta.1

### Beta Package Preparation
- [ ] Update version to 1.0.0-beta.1
- [ ] Add beta warning to README
- [ ] Create beta testing guide
- [ ] Prepare feedback collection method

### Publish Beta
- [ ] Build: `npm run build`
- [ ] Test install from tarball
- [ ] Publish: `npm publish --tag beta`
- [ ] Verify on npm: `npm view @edge-memory/core@beta`
- [ ] Test install: `npm install @edge-memory/core@beta`

### Beta Announcement
- [ ] Create GitHub Discussion for beta testers
- [ ] Post in React Native communities
- [ ] Share with hackathon participants
- [ ] Reach out to Cactus team
- [ ] Personal network outreach
- [ ] Create issue templates for feedback

---

## Phase 10: Beta Feedback & Iteration

### Feedback Collection
- [ ] Monitor GitHub issues
- [ ] Monitor GitHub Discussions
- [ ] Track npm download stats
- [ ] Reach out to beta testers for feedback
- [ ] Document all reported issues
- [ ] Categorize feedback (bugs, features, docs)

### Bug Fixes
- [ ] Fix critical bugs immediately
- [ ] Fix high-priority bugs
- [ ] Fix medium-priority bugs
- [ ] Document known low-priority issues

### Iteration
- [ ] Publish beta.2 if needed
- [ ] Publish beta.3 if needed
- [ ] Continue until stable
- [ ] Minimum 2 weeks of beta testing

### Success Criteria
- [ ] 5+ external developers tested
- [ ] No critical bugs reported
- [ ] Positive feedback on developer experience
- [ ] At least 1 integration in real app
- [ ] Documentation validated by users

---

## Phase 11: iOS Testing (When Device Available)

### Setup
- [ ] Get iOS device or access to one
- [ ] Install demo app on iOS
- [ ] Test on iOS simulator as well

### iOS-Specific Testing
- [ ] Security-scoped bookmark creation
- [ ] Bookmark persistence across launches
- [ ] Files app integration
- [ ] File picker UI/UX
- [ ] iCloud Drive vs local storage
- [ ] App backgrounding behavior
- [ ] iOS permission model
- [ ] Different iOS versions (if possible)

### iOS Edge Cases
- [ ] User moves EdgeMemory folder
- [ ] User deletes EdgeMemory folder
- [ ] App update - bookmark survives?
- [ ] iOS storage optimization
- [ ] Low storage scenarios

### iOS Performance
- [ ] Benchmark same operations as Android
- [ ] Compare performance characteristics
- [ ] Document any iOS-specific issues

---

## Phase 12: Security Review

### Code Review
- [ ] Review file permission handling
- [ ] Review data validation
- [ ] Review error messages (no sensitive data leaked)
- [ ] Review logging (no sensitive data logged)
- [ ] Check for injection vulnerabilities
- [ ] Check for path traversal issues

### Data Security
- [ ] Verify files stored in correct location
- [ ] Verify file permissions are appropriate
- [ ] Verify no data leakage to logs
- [ ] Verify no data sent to network
- [ ] Consider encryption options (document)

### Dependency Audit
- [ ] Run `npm audit`
- [ ] Review all dependencies
- [ ] Update vulnerable dependencies
- [ ] Document security considerations

### Security Documentation
- [ ] Document security model
- [ ] Document data storage location
- [ ] Document permissions required
- [ ] Document privacy considerations
- [ ] Add security section to README

---

## Phase 13: Final Pre-Release

### Code Quality
- [ ] Run linter on all code
- [ ] Fix all linting errors
- [ ] Format code consistently
- [ ] Remove console.logs (or make conditional)
- [ ] Remove commented-out code
- [ ] Review all TODOs in code

### Documentation Final Review
- [ ] README.md - complete and accurate
- [ ] API docs - complete and accurate
- [ ] Examples - all working
- [ ] CHANGELOG.md - complete
- [ ] LICENSE - correct
- [ ] package.json - all fields correct

### Testing Final Pass
- [ ] All tests passing
- [ ] Coverage meets threshold
- [ ] Manual testing on Android
- [ ] Manual testing on iOS (if available)
- [ ] Test installation from tarball
- [ ] Test in fresh project

### Version Preparation
- [ ] Update version to 1.0.0
- [ ] Update CHANGELOG.md
- [ ] Remove beta warnings
- [ ] Final commit

---

## Phase 14: v1.0.0 Release

### Pre-Publish Checklist
- [ ] All tests passing
- [ ] Documentation complete
- [ ] No known critical bugs
- [ ] Beta feedback addressed
- [ ] Security review complete
- [ ] Examples working
- [ ] CHANGELOG.md finalized

### Publish
- [ ] Build: `npm run build`
- [ ] Verify build output
- [ ] Test tarball: `npm pack`
- [ ] Publish: `npm publish`
- [ ] Verify: `npm view @edge-memory/core`
- [ ] Test install: `npm install @edge-memory/core`

### GitHub Release
- [ ] Create release on GitHub
- [ ] Tag: v1.0.0
- [ ] Title: "Edge Memory Protocol v1.0.0"
- [ ] Copy CHANGELOG content
- [ ] Attach tarball (optional)
- [ ] Publish release

### Announcement
- [ ] Update main README
- [ ] Blog post (if applicable)
- [ ] Social media posts
- [ ] Reddit posts (r/reactnative, r/LocalLLaMA)
- [ ] Dev.to article
- [ ] Hacker News "Show HN"
- [ ] Email beta testers
- [ ] Thank contributors

### Post-Release
- [ ] Monitor issues closely
- [ ] Respond to questions quickly
- [ ] Fix critical bugs immediately
- [ ] Plan v1.0.1 if needed
- [ ] Start planning v1.1.0 features

---

## Ongoing Maintenance

### Regular Tasks
- [ ] Monitor GitHub issues weekly
- [ ] Respond to issues within 48 hours
- [ ] Run `npm audit` monthly
- [ ] Update dependencies quarterly
- [ ] Review and merge PRs
- [ ] Update documentation as needed

### Community Building
- [ ] Add to awesome lists
- [ ] Write blog posts about use cases
- [ ] Create video tutorials
- [ ] Present at meetups
- [ ] Engage with users
- [ ] Collect feature requests

---

## Notes

- Focus on Android testing until iOS device available
- No timeline pressure - work at your own pace
- Mark tasks complete as you go
- Add new tasks as needed
- Document issues and decisions
- Ask for help when stuck

**Current Phase:** Phase 1 - Testing Infrastructure
**Next Task:** Install Jest dependencies
