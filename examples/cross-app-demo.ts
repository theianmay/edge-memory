/**
 * Cross-App Demo - Edge Memory Protocol
 * 
 * This example demonstrates how two different apps can share
 * the same memory store using the Edge Memory Protocol.
 */

import { createMemoryStore } from '../sdk/src';

/**
 * Simulates App 1: A chat application
 */
async function chatApp() {
  console.log('\n=== APP 1: Chat Application ===\n');

  const memory = createMemoryStore({
    appId: 'com.example.chat',
    debug: true,
  });

  await memory.setup();
  await memory.initialize();

  // Chat app writes conversation context
  console.log('Writing conversation memories...');
  
  await memory.write({
    content: 'User mentioned they have a meeting with John on Friday',
    type: 'event',
    tags: ['calendar', 'person:john', 'conversation'],
  });

  await memory.write({
    content: 'User prefers concise responses',
    type: 'preference',
    tags: ['communication', 'style'],
  });

  await memory.write({
    content: 'User asked about weather in San Francisco',
    type: 'conversation',
    tags: ['location', 'weather'],
  });

  console.log('✓ Chat app wrote 3 memories\n');

  // Read what other apps have written
  const othersMemories = await memory.read({
    // Exclude our own app
  });
  
  const fromOtherApps = othersMemories.filter(m => m.src !== 'com.example.chat');
  console.log(`Found ${fromOtherApps.length} memories from other apps:`);
  fromOtherApps.forEach(m => {
    console.log(`  - [${m.src}] ${m.content}`);
  });
}

/**
 * Simulates App 2: A notes application
 */
async function notesApp() {
  console.log('\n=== APP 2: Notes Application ===\n');

  const memory = createMemoryStore({
    appId: 'com.example.notes',
    debug: true,
  });

  await memory.setup();
  await memory.initialize();

  // Notes app writes structured information
  console.log('Writing note memories...');

  await memory.write({
    content: "John's email: john@example.com",
    type: 'contact',
    tags: ['person:john', 'email'],
    meta: { verified: true },
  });

  await memory.write({
    content: 'Project deadline: Next Monday',
    type: 'event',
    tags: ['work', 'deadline'],
    meta: { priority: 'high' },
  });

  console.log('✓ Notes app wrote 2 memories\n');

  // Read memories from chat app
  const chatMemories = await memory.read({
    src: 'com.example.chat',
  });

  console.log(`Found ${chatMemories.length} memories from chat app:`);
  chatMemories.forEach(m => {
    console.log(`  - [${m.type}] ${m.content}`);
  });
}

/**
 * Simulates App 3: An AI assistant that reads from both
 */
async function assistantApp() {
  console.log('\n=== APP 3: AI Assistant ===\n');

  const memory = createMemoryStore({
    appId: 'com.example.assistant',
    debug: true,
  });

  await memory.setup();
  await memory.initialize();

  // Assistant reads all available context
  console.log('Reading all available memories...');
  
  const allMemories = await memory.read();
  
  console.log(`\nTotal memories available: ${allMemories.length}`);
  
  // Group by source app
  const byApp = allMemories.reduce((acc, m) => {
    acc[m.src] = (acc[m.src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nMemories by app:');
  Object.entries(byApp).forEach(([app, count]) => {
    console.log(`  ${app}: ${count} memories`);
  });

  // Find person-related information
  console.log('\nSearching for information about "John"...');
  const johnInfo = await memory.search('John');
  
  console.log(`Found ${johnInfo.length} memories about John:`);
  johnInfo.forEach(m => {
    console.log(`  - [${m.src}] ${m.content}`);
  });

  // Assistant can now use this context for AI responses
  console.log('\n📝 Assistant context for AI:');
  console.log('  - John has a meeting on Friday');
  console.log('  - John\'s email is john@example.com');
  console.log('  - User prefers concise responses');
  console.log('  - User is interested in San Francisco weather');
}

/**
 * Run the cross-app demo
 */
async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Edge Memory Protocol - Cross-App Sharing Demo        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    // Simulate three different apps accessing shared memory
    await chatApp();
    await notesApp();
    await assistantApp();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  Demo Complete!                                        ║');
    console.log('║                                                        ║');
    console.log('║  All three apps successfully shared memory through     ║');
    console.log('║  the Edge Memory Protocol. Each app can read what      ║');
    console.log('║  others have written, enabling rich cross-app AI       ║');
    console.log('║  experiences while keeping all data local.             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demo
runDemo();
