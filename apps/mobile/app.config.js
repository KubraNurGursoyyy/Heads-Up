module.exports = {
  expo: {
    name: 'HeadsUp',
    slug: 'headsup',
    owner: 'kubranurgursoyys-team',

    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',

    icon: './assets/icon.png',

    android: {
      package: 'com.headsup.app',
      versionCode: 1,

      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F8DCE7',
      },
    },

    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          backgroundColor: '#F8DCE7',
          resizeMode: 'contain',
          imageWidth: 260,
        },
      ],

      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#C76A8E',
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
        projectId: 'f3666043-3ebe-4394-bbb8-8e277c0449c2',
      },
    },
  },
};