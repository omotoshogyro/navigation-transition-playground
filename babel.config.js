module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // must stay last
    plugins: ['react-native-worklets/plugin'],
  };
};
