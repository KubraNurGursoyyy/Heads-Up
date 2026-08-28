module.exports = {
  expo: {
    name: 'HeadsUp', slug: 'headsup', version: '0.1.0', orientation: 'portrait', userInterfaceStyle: 'automatic',
    android: { package: 'com.headsup.app', versionCode: 1 },
    plugins: [
      ['expo-notifications', { defaultChannel: 'important-news' }],
      ['expo-build-properties', { android: { compileSdkVersion: 36, targetSdkVersion: 36, buildToolsVersion: '36.0.0' } }],
      ['expo-secure-store', { configureAndroidBackup: true }]
    ],
    extra: { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '' } }
  }
};
