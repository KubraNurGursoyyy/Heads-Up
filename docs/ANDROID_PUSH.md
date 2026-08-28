# Android push setup

HeadsUp uses `expo-notifications` on the device and the Expo Push Service from the backend.

## Important

Remote push on Android cannot be fully tested in Expo Go. Build a development client or release build.

## Steps

1. `cd apps/mobile`
2. `npx eas login`
3. `npx eas init`
4. Put the generated project id into `EXPO_PUBLIC_EAS_PROJECT_ID`.
5. `npx eas build --profile development --platform android`
6. Install the build on a real Android device.
7. Start Metro with `npx expo start --dev-client`.
8. Log in. The app asks for notification permission and registers the Expo push token with the backend.

The Android notification channel is created as `important-news` with high importance.
