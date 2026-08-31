import { Platform } from 'react-native';

export const isDemoMode =
  Platform.OS === 'web' && String(process.env.EXPO_PUBLIC_DEMO_MODE).toLowerCase() === 'true';
