/**
 * Edge Memory Protocol - Expo/React Native Platform Handler
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { AccessDeniedError, PlatformAccessHandler } from '../types';

const BOOKMARK_KEY = '@edge_memory_bookmark';
const STANDARD_FOLDER = 'EdgeMemory';
const STANDARD_FILE = 'memory.jsonl';

/**
 * Expo-based platform handler for React Native
 */
export class ExpoPlatformHandler implements PlatformAccessHandler {
  private bookmarkUri?: string;
  private createdFileUris: Map<string, string> = new Map(); // Track created file URIs

  async getFilePath(): Promise<string> {
    if (Platform.OS === 'ios') {
      return await this.getIOSFilePath();
    } else if (Platform.OS === 'android') {
      return await this.getAndroidFilePath();
    } else {
      throw new Error(`Unsupported platform: ${Platform.OS}`);
    }
  }

  async hasAccess(): Promise<boolean> {
    try {
      // Check if we have a saved bookmark
      const bookmark = await AsyncStorage.getItem(BOOKMARK_KEY);
      
      if (!bookmark) {
        return false;
      }

      this.bookmarkUri = bookmark;

      // Try to access the file to verify permission is still valid
      const filePath = await this.getFilePath();
      const file = new File(filePath);
      file.exists;
      
      return true; // If we got here, we have access
    } catch (error) {
      return false;
    }
  }

  async requestAccess(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await this.requestIOSAccess();
      } else if (Platform.OS === 'android') {
        return await this.requestAndroidAccess();
      }
      return false;
    } catch (error) {
      console.error('Failed to request access:', error);
      return false;
    }
  }

  async readFile(path: string): Promise<string> {
    try {
      // Use StorageAccessFramework for Android content URIs
      if (Platform.OS === 'android' && path.startsWith('content://')) {
        return await StorageAccessFramework.readAsStringAsync(path);
      }
      
      // Use regular File API for iOS and other paths
      const file = new File(path);
      if (!file.exists) {
        return '';
      }
      return await file.text();
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist, return empty string
        return '';
      }
      throw error;
    }
  }

  async appendFile(path: string, content: string): Promise<void> {
    // Expo doesn't have native append, so we read + write
    const existing = await this.readFile(path);
    
    // Use StorageAccessFramework for Android content URIs
    if (Platform.OS === 'android' && path.startsWith('content://')) {
      await StorageAccessFramework.writeAsStringAsync(path, existing + content);
      return;
    }
    
    const file = new File(path);
    await file.write(existing + content);
  }

  async writeFile(path: string, content: string): Promise<void> {
    console.log('✍️ [Platform] Writing to path:', path);
    
    // Use StorageAccessFramework for Android content URIs
    if (Platform.OS === 'android' && path.startsWith('content://')) {
      // Check if file exists, if not we need to create it first
      const exists = await this.fileExists(path);
      if (!exists) {
        // Extract filename from content URI
        const filename = path.split('%2F').pop() || path.split('/').pop() || 'unknown';
        console.log('✍️ [Platform] File does not exist, creating:', filename);
        
        // Create the file first (SAF requires file to exist before writing)
        const parentUri = this.bookmarkUri;
        if (parentUri) {
          // Use wildcard MIME type to preserve exact filename
          const newFileUri = await StorageAccessFramework.createFileAsync(
            parentUri,
            filename, // Use full filename including extension
            '*/*' // Wildcard MIME type - no automatic extension
          );
          console.log('✍️ [Platform] Created file:', newFileUri);
          // Track the created file URI for later deletion
          this.createdFileUris.set(path, newFileUri);
          // Now write to the newly created file
          await StorageAccessFramework.writeAsStringAsync(newFileUri, content);
        } else {
          throw new Error('No parent URI available to create file');
        }
      } else {
        await StorageAccessFramework.writeAsStringAsync(path, content);
      }
      console.log('✍️ [Platform] Write complete (SAF)');
      return;
    }
    
    // Use regular File API for iOS and other paths
    const file = new File(path);
    console.log('✍️ [Platform] File exists before write:', file.exists);
    await file.write(content);
    console.log('✍️ [Platform] Write complete');
  }

  async fileExists(path: string): Promise<boolean> {
    // For Android content URIs, try to read and catch error if doesn't exist
    if (Platform.OS === 'android' && path.startsWith('content://')) {
      try {
        await StorageAccessFramework.readAsStringAsync(path);
        return true;
      } catch {
        return false;
      }
    }
    
    const file = new File(path);
    return file.exists;
  }

  async deleteFile(path: string): Promise<void> {
    try {
      // Use StorageAccessFramework for Android content URIs
      if (Platform.OS === 'android' && path.startsWith('content://')) {
        // Check if we created this file and have a different URI for it
        const actualUri = this.createdFileUris.get(path) || path;
        await StorageAccessFramework.deleteAsync(actualUri);
        this.createdFileUris.delete(path); // Clean up tracking
        return;
      }
      
      const file = new File(path);
      if (file.exists) {
        await file.delete();
      }
    } catch (error) {
      // File might not exist or already deleted, which is fine
      console.warn('⚠️ [Platform] Delete file failed:', error);
    }
  }

  async ensureDirectory(path: string): Promise<void> {
    // Skip directory creation for content URIs (Android SAF)
    // The directory already exists since user selected it via picker
    if (path.startsWith('content://')) {
      return;
    }
    
    const dir = new Directory(path);
    if (!dir.exists) {
      await dir.create();
    }
  }

  // iOS-specific methods

  private async getIOSFilePath(): Promise<string> {
    if (!this.bookmarkUri) {
      throw new AccessDeniedError('No bookmark URI available');
    }
    
    // The bookmark URI should point to the EdgeMemory folder
    // Remove trailing slash if present, then append the filename
    const baseUri = this.bookmarkUri.endsWith('/') 
      ? this.bookmarkUri.slice(0, -1) 
      : this.bookmarkUri;
    return `${baseUri}/${STANDARD_FILE}`;
  }

  private async requestIOSAccess(): Promise<boolean> {
    try {
      // Ask user to select the EdgeMemory folder using Directory picker
      const directory = await Directory.pickDirectoryAsync();

      // Save the bookmark
      const uri = directory.uri;
      await AsyncStorage.setItem(BOOKMARK_KEY, uri);
      this.bookmarkUri = uri;

      return true;
    } catch (error) {
      console.error('iOS access request failed:', error);
      return false;
    }
  }

  // Android-specific methods

  private async getAndroidFilePath(): Promise<string> {
    if (!this.bookmarkUri) {
      throw new AccessDeniedError('No bookmark URI available');
    }
    
    // Check if file already exists in the directory
    const files = await StorageAccessFramework.readDirectoryAsync(this.bookmarkUri);
    console.log('📄 [Platform] Files in directory:', files);
    
    // Look for existing memory.jsonl file (check both with and without extension in URI)
    const existingFile = files.find((uri: string) => 
      uri.includes('memory.jsonl') || uri.endsWith('%2Fmemory.jsonl') || uri.endsWith('memory')
    );
    
    if (existingFile) {
      console.log('📄 [Platform] Found existing file:', existingFile);
      return existingFile;
    }
    
    // Create new file using StorageAccessFramework
    // Use wildcard MIME type to prevent automatic extension addition
    console.log('📄 [Platform] Creating new file in:', this.bookmarkUri);
    const fileUri = await StorageAccessFramework.createFileAsync(
      this.bookmarkUri,
      'memory.jsonl', // Full filename with extension
      '*/*' // Wildcard MIME type - no automatic extension
    );
    console.log('📄 [Platform] Created file URI:', fileUri);
    return fileUri;
  }

  private async requestAndroidAccess(): Promise<boolean> {
    try {
      // Ask user to select the EdgeMemory folder using Directory picker
      const directory = await Directory.pickDirectoryAsync();

      // Save the bookmark
      const uri = directory.uri;
      console.log('📁 [Platform] Selected directory URI:', uri);
      await AsyncStorage.setItem(BOOKMARK_KEY, uri);
      this.bookmarkUri = uri;

      return true;
    } catch (error) {
      console.error('Android access request failed:', error);
      return false;
    }
  }
}

/**
 * Create platform handler for current platform
 */
export function createPlatformHandler(): PlatformAccessHandler {
  return new ExpoPlatformHandler();
}
