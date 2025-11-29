/**
 * Singleton Memory Store
 * Ensures only one instance exists across the entire app
 */

import type { EdgeMemoryStore } from '../sdk/src';
import { createMemoryStore } from '../sdk/src';

let instance: EdgeMemoryStore | null = null;

export function getMemoryStore(): EdgeMemoryStore {
  if (!instance) {
    instance = createMemoryStore({
      appId: 'com.caesiusbay.empchat',
      debug: true,
    });
  }
  return instance;
}

// For testing/cleanup
export function resetMemoryStore() {
  instance = null;
}
