# Setup Guide

This guide will help you set up the Edge Memory Protocol in your React Native/Expo application.

## Prerequisites

- Node.js 18+ and npm
- Expo CLI or React Native CLI
- iOS Simulator or Android Emulator (for testing)

## Installation

### 1. Install the SDK

```bash
npm install @edge-memory/core
```

### 2. Install Peer Dependencies

```bash
npm install expo-file-system expo-document-picker @react-native-async-storage/async-storage
```

### 3. Configure Your App

No additional configuration needed for basic usage!

## Platform-Specific Setup

### iOS

#### Option 1: Using Expo (Recommended)

No additional setup required. The SDK will use Expo's document picker.

#### Option 2: Bare React Native

Add to your `Info.plist`:

```xml
<key>UISupportsDocumentBrowser</key>
<true/>
```

### Android

#### Option 1: Using Expo (Recommended)

No additional setup required.

#### Option 2: Bare React Native

Add to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

## First Run

### 1. Initialize the Memory Store

```typescript
import { createMemoryStore } from '@edge-memory/core';

const memory = createMemoryStore({
  appId: 'com.yourcompany.yourapp', // Use your app's reverse domain
  debug: true, // Enable logging during development
});
```

### 2. Request User Permission

```typescript
// Check if already set up
const isReady = await memory.isReady();

if (!isReady) {
  // Request access (shows platform-specific UI)
  const granted = await memory.setup();
  
  if (!granted) {
    console.log('User denied access');
    return;
  }
}

// Initialize
await memory.initialize();
```

### 3. User Experience

**iOS:**
- User will see the Files app picker
- They should navigate to or create an "EdgeMemory" folder
- Folder can be in "On My iPhone" or "iCloud Drive"
- Permission is saved for future launches

**Android:**
- SDK automatically creates `Documents/EdgeMemory` folder
- No user interaction needed
- Uses app's document directory

## Usage Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { createMemoryStore } from '@edge-memory/core';

export default function App() {
  const [memory] = useState(() => createMemoryStore({
    appId: 'com.example.myapp',
    debug: true,
  }));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setupMemory();
  }, []);

  const setupMemory = async () => {
    try {
      const ready = await memory.isReady();
      
      if (!ready) {
        const granted = await memory.setup();
        if (!granted) {
          Alert.alert('Permission Required', 'Please grant access to use memory features');
          return;
        }
      }

      await memory.initialize();
      setIsReady(true);
    } catch (error) {
      console.error('Failed to setup memory:', error);
    }
  };

  const writeMemory = async () => {
    try {
      await memory.write({
        content: 'User clicked the button',
        type: 'event',
        tags: ['interaction'],
      });
      Alert.alert('Success', 'Memory saved!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const readMemories = async () => {
    try {
      const memories = await memory.read({ limit: 10 });
      console.log('Memories:', memories);
      Alert.alert('Memories', `Found ${memories.length} memories`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Setting up memory...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Button title="Write Memory" onPress={writeMemory} />
      <Button title="Read Memories" onPress={readMemories} />
    </View>
  );
}
```

## Testing Cross-App Sharing

### 1. Create Two Apps

Create two separate Expo/React Native apps that both use the Edge Memory SDK.

### 2. Use Same Memory Location

Both apps should use the same EdgeMemory folder:

**iOS:** User selects the same folder in Files app  
**Android:** Both apps automatically use `Documents/EdgeMemory`

### 3. Write from App 1

```typescript
// App 1
await memory.write({
  content: 'Hello from App 1',
  type: 'message',
  tags: ['test'],
});
```

### 4. Read from App 2

```typescript
// App 2
const memories = await memory.read({ tags: ['test'] });
console.log(memories); // Should see message from App 1
```

## Troubleshooting

### "Access Denied" Error

**iOS:**
- Make sure user selected a folder in Files app
- Check that the folder still exists
- Try calling `memory.setup()` again

**Android:**
- Check that storage permissions are granted
- Verify the app has write access to Documents folder

### "Lock Timeout" Error

- Another app might be writing to the file
- Wait a moment and try again
- Check that no app is stuck with a lock

### File Not Found

- Make sure `initialize()` was called after `setup()`
- Check that the EdgeMemory folder exists
- Verify file permissions

### TypeScript Errors

Make sure you have the correct peer dependencies installed:

```bash
npm install --save-dev @types/react-native
```

## Next Steps

- Read the [Protocol Specification](../spec/v1.0/specification.md)
- Check out the [SDK API Reference](../sdk/README.md)
- Build your first memory-enabled app!

## Support

- GitHub Issues: [Report bugs or request features]
- Discord: [Join the community]
- Documentation: [Full docs]
