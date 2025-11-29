/**
 * Basic Usage Example - Edge Memory Protocol
 * 
 * This example demonstrates how to use the Edge Memory SDK
 * to write and read memories in a React Native app.
 */

import { createMemoryStore } from '../sdk/src';

async function basicExample() {
  console.log('=== Edge Memory Protocol - Basic Example ===\n');

  // 1. Create memory store
  console.log('1. Creating memory store...');
  const memory = createMemoryStore({
    appId: 'com.example.demo',
    debug: true,
  });

  // 2. Setup (in real app, this shows platform-specific UI)
  console.log('2. Setting up access...');
  const granted = await memory.setup();
  if (!granted) {
    console.error('Access denied by user');
    return;
  }

  // 3. Initialize
  console.log('3. Initializing...');
  await memory.initialize();
  console.log('✓ Memory store ready!\n');

  // 4. Write some memories
  console.log('4. Writing memories...');
  
  await memory.write({
    content: 'User prefers dark mode',
    type: 'preference',
    tags: ['ui', 'theme'],
  });
  console.log('✓ Wrote preference');

  await memory.write({
    content: 'Meeting with John on Friday at 2pm',
    type: 'event',
    tags: ['calendar', 'person:john'],
    meta: { priority: 'high' },
  });
  console.log('✓ Wrote event');

  await memory.write({
    content: 'User lives in San Francisco',
    type: 'fact',
    tags: ['location', 'personal'],
  });
  console.log('✓ Wrote fact\n');

  // 5. Read all memories
  console.log('5. Reading all memories...');
  const allMemories = await memory.read();
  console.log(`Found ${allMemories.length} memories:`);
  allMemories.forEach(m => {
    console.log(`  - [${m.type}] ${m.content}`);
  });
  console.log();

  // 6. Filter by type
  console.log('6. Reading preferences only...');
  const preferences = await memory.read({ type: 'preference' });
  console.log(`Found ${preferences.length} preferences:`);
  preferences.forEach(m => {
    console.log(`  - ${m.content}`);
  });
  console.log();

  // 7. Filter by tags
  console.log('7. Reading memories tagged "personal"...');
  const personal = await memory.read({ tags: ['personal'] });
  console.log(`Found ${personal.length} personal memories:`);
  personal.forEach(m => {
    console.log(`  - ${m.content}`);
  });
  console.log();

  // 8. Search by keyword
  console.log('8. Searching for "San Francisco"...');
  const searchResults = await memory.search('San Francisco');
  console.log(`Found ${searchResults.length} results:`);
  searchResults.forEach(m => {
    console.log(`  - ${m.content}`);
  });
  console.log();

  // 9. Get statistics
  console.log('9. Getting statistics...');
  const stats = await memory.stats();
  console.log('Statistics:');
  console.log(`  Total entries: ${stats.totalEntries}`);
  console.log(`  By type:`, stats.byType);
  console.log(`  By source:`, stats.bySource);
  console.log();

  // 10. Export
  console.log('10. Exporting memories...');
  const exported = await memory.export();
  console.log('Exported JSON (first 200 chars):');
  console.log(exported.substring(0, 200) + '...\n');

  console.log('=== Example Complete ===');
}

// Run the example
basicExample().catch(console.error);
