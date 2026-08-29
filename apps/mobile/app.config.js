const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  'f3666043-3ebe-4394-bbb8-8e277c0449c2';

module.exports = {
  expo: {
    name: 'HeadsUp',
    slug: 'headsup',
    owner: 'kubranurgursoyys-team',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/launcher-icon.png',

    android: {
      package: 'com.headsup.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/launcher-icon.png',
        backgroundColor: '#F7C8DA',
      },
    },

    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/native-splash-transparent.png',
          backgroundColor: '#F7C8DA',
          resizeMode: 'contain',
          imageWidth: 1,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#D31578',
          defaultChannel: 'important-news',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: '36.0.0',
          },
        },
      ],
      [
        'expo-secure-store',
        {
          configureAndroidBackup: true,
        },
      ],
    ],

    extra: {
      eas: {
        projectId: easProjectId,
      },
    },
  },
};