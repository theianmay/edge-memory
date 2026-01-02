# Quick Start Guide - EMP Chat Demo

Get the Edge Memory Protocol demo app running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- iOS Simulator or Android Emulator
- Expo Go app (optional, for physical device testing)

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Edge Memory SDK
- Cactus React Native
- Expo dependencies
- All required packages

## Step 2: Start the App

```bash
npm start
```

This will:
1. Start the Expo development server
2. Show a QR code
3. Display options for running on different platforms

## Step 3: Choose Platform

### Option A: iOS Simulator
Press `i` in the terminal

### Option B: Android Emulator
Press `a` in the terminal

### Option C: Physical Device
1. Install Expo Go from App Store / Play Store
2. Scan the QR code with your camera (iOS) or Expo Go app (Android)

## Step 4: First Launch

When the app starts:

### iOS
1. You'll see a file picker
2. Navigate to "On My iPhone" or "iCloud Drive"
3. Create or select "EdgeMemory" folder
4. Grant permission

### Android
1. App automatically creates `Documents/EdgeMemory` folder
2. No user action needed

### Model Download
- Cactus LLM will download automatically
- Progress shown on screen
- Takes 1-2 minutes depending on connection

## Step 5: Start Chatting!

Once initialized:
1. Type a message in the input field
2. Tap "Send"
3. Wait for AI response
4. Notice memory counter in header

### Try These Examples

**Test Preference Learning:**
```
You: "I prefer short answers"
AI: [Responds]
You: "What's 2+2?"
AI: [Gives brief answer using your preference]
```

**Test Fact Memory:**
```
You: "My name is Alex"
AI: [Responds]
[Close and reopen app]
You: "What's my name?"
AI: "Your name is Alex"
```

**Test Context:**
```
You: "I'm planning a trip to Tokyo"
AI: [Responds]
You: "What should I pack?"
AI: [Knows about Tokyo trip from memory]
```

## Step 6: Explore Memories

1. Tap "Memories" tab at bottom
2. See all stored memories
3. Filter by type (preference, fact, conversation)
4. Delete or export as needed

## Troubleshooting

### "Permission Required" Alert
- **iOS**: Select the EdgeMemory folder again
- **Android**: Check storage permissions in Settings

### "Failed to Initialize"
- Close and restart the app
- Check console for error details
- Ensure folder permissions are granted

### Model Download Stuck
- Check internet connection
- Restart the app
- Check available storage space

### No Memories Showing
- Make sure you've sent at least one message
- Try refreshing (pull down on Memories screen)
- Check that memory initialization succeeded

## Understanding the UI

### Chat Screen
- **Header**: Shows memory count and preferences
- **Messages**: Chat history (blue = you, white = AI)
- **Input**: Type messages here
- **Clear Button**: Clears all memories

### Memories Screen
- **Filters**: All, Preference, Fact, Conversation
- **Cards**: Each memory with type, content, tags
- **Delete**: Remove individual memories
- **Export**: Save memories as JSON

## What's Happening Behind the Scenes

### When You Send a Message:
1. ✅ App searches for relevant memories
2. ✅ Retrieves recent context (last 7 days)
3. ✅ Gets your preferences
4. ✅ Combines context for AI
5. ✅ Sends to Cactus LLM
6. ✅ Extracts new memories from conversation
7. ✅ Stores in shared memory file

### Memory File Location:
- **iOS**: `[Selected Folder]/memory.jsonl`
- **Android**: `/storage/emulated/0/Documents/EdgeMemory/memory.jsonl`

You can view this file with any text editor!

## Next Steps

### Test Cross-App Sharing
1. Create a second app using the Edge Memory SDK
2. Point both apps to the same EdgeMemory folder
3. Write memories in one app
4. Read them in the other app

### Customize the App
- Edit `app/index.tsx` to change chat UI
- Modify memory extraction logic
- Add new memory types
- Implement semantic search

### Build for Production
```bash
# iOS
npm run ios

# Android
npm run android
```

## Demo Script

Want to show off the app? Try this:

1. **Open app** → "Memory-enabled chat ready!"
2. **Say**: "I prefer dark mode" → Memory stored
3. **Check Memories tab** → See preference stored
4. **Say**: "My favorite color is blue" → Another memory
5. **Close and reopen app** → Context preserved
6. **Say**: "What do you know about me?" → AI recalls memories
7. **Show Memories tab** → All memories visible
8. **Export** → Show JSON format

## Key Features to Highlight

✅ **Local-First**: All data stays on device  
✅ **Cross-App**: Other apps can use same memories  
✅ **Privacy**: User controls everything  
✅ **Persistent**: Memories survive app restarts  
✅ **Smart**: Context-aware AI responses  
✅ **Transparent**: View/edit/delete all memories  

## Resources

- **Protocol Spec**: `spec/v1.0/specification.md`
- **SDK Docs**: `sdk/README.md`
- **Setup Guide**: `docs/SETUP.md`
- **App README**: `app/README.md`

## Getting Help

- Check console logs (debug mode enabled)
- Review error messages in alerts
- Inspect memory file directly
- See examples in `examples/` folder

## Success!

You now have a working memory-enabled chat app demonstrating the Edge Memory Protocol! 🎉

The app shows how:
- Multiple apps can share AI memory
- All data stays local and private
- Users maintain full control
- Context improves AI responses
- Simple JSONL format enables interoperability

**Ready to build your own memory-enabled app?** Check out the SDK documentation!
