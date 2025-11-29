/**
 * Edge Memory Protocol - Expo/React Native Platform Handler
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
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
    const file = new File(path);
    await file.write(existing + content);
  }

  async writeFile(path: string, content: string): Promise<void> {
    const file = new File(path);
    await file.write(content);
  }

  async fileExists(path: string): Promise<boolean> {
    const file = new File(path);
    return file.exists;
  }

  async deleteFile(path: string): Promise<void> {
    try {
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
    // We append the filename
    return `${this.bookmarkUri}/${STANDARD_FILE}`;
  }

  private async requestIOSAccess(): Promise<boolean> {
    try {
      // Ask user to select the EdgeMemory folder
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return false;
      }

      // Save the bookmark
      const uri = result.assets[0].uri;
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
    if (this.bookmarkUri) {
      // User has selected a custom location
      return `${this.bookmarkUri}/${STANDARD_FILE}`;
    }

    // Use standard Documents location
    const documentsDir = Paths.document.uri;
    return `${documentsDir}${STANDARD_FOLDER}/${STANDARD_FILE}`;
  }

  private async requestAndroidAccess(): Promise<boolean> {
    try {
      // On Android, we can use the standard Documents location
      // or ask user to pick a folder

      // Option 1: Use standard location (simpler)
      const documentsDir = Paths.document.uri;
      const edgeMemoryDir = `${documentsDir}${STANDARD_FOLDER}`;
      
      await this.ensureDirectory(edgeMemoryDir);
      
      // Save a marker that we've set up
      await AsyncStorage.setItem(BOOKMARK_KEY, edgeMemoryDir);
      this.bookmarkUri = edgeMemoryDir;

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
