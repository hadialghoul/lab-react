import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}images/`;

// Create cache directory if it doesn't exist
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
    console.log('📁 Image cache directory created');
  }
};

// Get cached file path from URL
const getCacheKey = (url) => {
  // Create filename from URL hash
  const filename = url.split('/').pop() || 'image';
  return `${IMAGE_CACHE_DIR}${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
};

// Get cached image or download and cache it
export const getCachedImage = async (url) => {
  if (!url || !url.startsWith('http')) {
    return url; // Return as-is if not a URL
  }

  try {
    await ensureDirExists();
    
    const cacheKey = getCacheKey(url);
    const fileInfo = await FileSystem.getInfoAsync(cacheKey);
    
    // If cached, return cached path
    if (fileInfo.exists) {
      console.log('✅ Loading from cache:', url);
      return cacheKey;
    }
    
    // Otherwise, download and cache
    console.log('📥 Downloading and caching:', url);
    const downloadResult = await FileSystem.downloadAsync(url, cacheKey);
    
    if (downloadResult.status === 200) {
      console.log('✅ Image cached:', url);
      return downloadResult.uri;
    } else {
      console.log('❌ Download failed, using original URL');
      return url;
    }
  } catch (error) {
    console.log('❌ Cache error, using original URL:', error.message);
    return url; // Fallback to original URL
  }
};

// Clear old cached images (optional - call periodically)
export const clearImageCache = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
      console.log('🗑️ Image cache cleared');
    }
  } catch (error) {
    console.log('❌ Error clearing cache:', error.message);
  }
};

export default {
  getCachedImage,
  clearImageCache,
};



