import React, { useState, useEffect } from 'react';
import { Image, ActivityIndicator, View, StyleSheet } from 'react-native';
import { getCachedImage } from '../utils/imageCache';

export default function CachedImage({ source, style, ...props }) {
  const [cachedUri, setCachedUri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (source?.uri) {
        setLoading(true);
        const cached = await getCachedImage(source.uri);
        setCachedUri(cached);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    
    loadImage();
  }, [source?.uri]);

  if (!source?.uri) {
    return <Image source={source} style={style} {...props} />;
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#5DCCBB" />
        </View>
      )}
      {cachedUri && (
        <Image
          source={{ uri: cachedUri }}
          style={[StyleSheet.absoluteFill, style]}
          {...props}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});


