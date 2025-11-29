/**
 * Edge Memory Protocol - Entry Validation
 */

import { EdgeMemoryEntry, ValidationError } from './types';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VERSION_REGEX = /^\d+\.\d+$/;
const REVERSE_DOMAIN_REGEX = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/;
const TAG_REGEX = /^[a-z0-9:_-]+$/;

/**
 * Validate a memory entry against the protocol schema
 */
export function validateEntry(entry: any): asserts entry is EdgeMemoryEntry {
  // Check required fields exist
  if (!entry || typeof entry !== 'object') {
    throw new ValidationError('Entry must be an object');
  }

  // Validate version
  if (typeof entry.v !== 'string') {
    throw new ValidationError('Field "v" must be a string', 'v', entry.v);
  }
  if (!VERSION_REGEX.test(entry.v)) {
    throw new ValidationError(
      'Field "v" must match format "MAJOR.MINOR"',
      'v',
      entry.v
    );
  }

  // Validate id
  if (typeof entry.id !== 'string') {
    throw new ValidationError('Field "id" must be a string', 'id', entry.id);
  }
  if (!UUID_V4_REGEX.test(entry.id)) {
    throw new ValidationError(
      'Field "id" must be a valid UUID v4',
      'id',
      entry.id
    );
  }

  // Validate timestamp
  if (typeof entry.ts !== 'number') {
    throw new ValidationError('Field "ts" must be a number', 'ts', entry.ts);
  }
  if (entry.ts < 0) {
    throw new ValidationError(
      'Field "ts" must be a positive number',
      'ts',
      entry.ts
    );
  }
  if (!Number.isInteger(entry.ts)) {
    throw new ValidationError(
      'Field "ts" must be an integer',
      'ts',
      entry.ts
    );
  }

  // Validate source
  if (typeof entry.src !== 'string') {
    throw new ValidationError('Field "src" must be a string', 'src', entry.src);
  }
  if (!REVERSE_DOMAIN_REGEX.test(entry.src)) {
    throw new ValidationError(
      'Field "src" must be in reverse domain notation (e.g., "com.example.app")',
      'src',
      entry.src
    );
  }

  // Validate content
  if (typeof entry.content !== 'string') {
    throw new ValidationError(
      'Field "content" must be a string',
      'content',
      entry.content
    );
  }
  if (entry.content.length === 0) {
    throw new ValidationError(
      'Field "content" must not be empty',
      'content',
      entry.content
    );
  }

  // Validate optional fields
  if (entry.type !== undefined) {
    if (typeof entry.type !== 'string') {
      throw new ValidationError(
        'Field "type" must be a string',
        'type',
        entry.type
      );
    }
  }

  if (entry.tags !== undefined) {
    if (!Array.isArray(entry.tags)) {
      throw new ValidationError(
        'Field "tags" must be an array',
        'tags',
        entry.tags
      );
    }
    for (const tag of entry.tags) {
      if (typeof tag !== 'string') {
        throw new ValidationError(
          'All tags must be strings',
          'tags',
          entry.tags
        );
      }
      if (!TAG_REGEX.test(tag)) {
        throw new ValidationError(
          'Tags must contain only lowercase letters, numbers, colons, underscores, and hyphens',
          'tags',
          tag
        );
      }
    }
    // Check for duplicates
    const uniqueTags = new Set(entry.tags);
    if (uniqueTags.size !== entry.tags.length) {
      throw new ValidationError(
        'Tags must be unique',
        'tags',
        entry.tags
      );
    }
  }

  if (entry.meta !== undefined) {
    if (typeof entry.meta !== 'object' || entry.meta === null || Array.isArray(entry.meta)) {
      throw new ValidationError(
        'Field "meta" must be an object',
        'meta',
        entry.meta
      );
    }
  }

  if (entry.emb !== undefined) {
    if (!Array.isArray(entry.emb)) {
      throw new ValidationError(
        'Field "emb" must be an array',
        'emb',
        entry.emb
      );
    }
    if (entry.emb.length === 0) {
      throw new ValidationError(
        'Field "emb" must not be empty',
        'emb',
        entry.emb
      );
    }
    for (const value of entry.emb) {
      if (typeof value !== 'number') {
        throw new ValidationError(
          'All embedding values must be numbers',
          'emb',
          entry.emb
        );
      }
    }
  }

  // Check for unknown fields
  const knownFields = new Set(['v', 'id', 'ts', 'src', 'content', 'type', 'tags', 'meta', 'emb']);
  for (const key of Object.keys(entry)) {
    if (!knownFields.has(key)) {
      throw new ValidationError(
        `Unknown field "${key}"`,
        key,
        entry[key]
      );
    }
  }
}

/**
 * Validate protocol version compatibility
 */
export function isVersionCompatible(entryVersion: string, supportedVersion: string): boolean {
  const [entryMajor] = entryVersion.split('.').map(Number);
  const [supportedMajor] = supportedVersion.split('.').map(Number);
  
  // Same major version = compatible
  return entryMajor === supportedMajor;
}

/**
 * Generate a valid UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate app ID format
 */
export function validateAppId(appId: string): void {
  if (!REVERSE_DOMAIN_REGEX.test(appId)) {
    throw new ValidationError(
      'App ID must be in reverse domain notation (e.g., "com.example.app")',
      'appId',
      appId
    );
  }
}
