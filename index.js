import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { registerRootComponent } from 'expo';

/**
 * Bootstrap: load App in a try/catch so if the app crashes BEFORE opening
 * (e.g. during import of App.js or its screens), we show the error on screen
 * instead of a white crash. TestFlight users will see WHY it crashed.
 *
 * iOS crash finder: on iOS we show ONLY a green View and never load App.
 * If it still crashes → problem is native/Expo. If it doesn't → problem is in App/navigator.
 */
function Bootstrap() {
  const [AppComponent, setAppComponent] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // iOS: skip loading App entirely – only a green View. No Text, no navigator, no screens.
  if (Platform.OS === 'ios') {
    return <View style={styles.splash} />;
  }

  useEffect(() => {
    try {
      const App = require('./App').default;
      setAppComponent(() => App);
    } catch (err) {
      setLoadError(err);
      console.error('SmileReign failed to load:', err?.message, err?.stack);
    }
  }, []);

  if (loadError) {
    const message = loadError?.message || String(loadError);
    const stack = loadError?.stack || '';
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>SmileReign couldn't start</Text>
        <Text style={styles.errorMessage} selectable>{message}</Text>
        {stack ? <Text style={styles.errorStack} selectable>{stack}</Text> : null}
      </View>
    );
  }

  if (!AppComponent) {
    if (__DEV__) console.warn('[SmileReign] Bootstrap: showing splash (App not loaded yet)');
    return <View style={styles.splash} />;
  }

  if (__DEV__) console.warn('[SmileReign] Bootstrap: rendering App');
  return <AppComponent />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    padding: 24,
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 11,
    color: '#5A6C7D',
    fontFamily: 'monospace',
  },
});

registerRootComponent(Bootstrap);
