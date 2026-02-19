module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Required for react-native-reanimated – must be listed last. Without this,
    // the app can crash on launch (e.g. on TestFlight).
    plugins: ['react-native-reanimated/plugin'],
  };
};
