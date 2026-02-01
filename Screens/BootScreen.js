/**
 * Minimal first screen: NO Image, NO Text, NO WebView.
 * Used to find out WHEN the app crashes:
 * - If it crashes in the first ~3 seconds → problem is bootstrap / navigator / this screen.
 * - If it crashes when this screen navigates to main → problem is MainScreen.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BOOT_DELAY_MS = 3000;

export default function BootScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('main');
    }, BOOT_DELAY_MS);
    return () => clearTimeout(t);
  }, [navigation]);

  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#C8E6C9',
  },
});
