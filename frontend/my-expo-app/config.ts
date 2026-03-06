import { Platform } from 'react-native';

// In Expo, localhost works for iOS simulator, but Android emulator needs 10.0.2.2
export const API_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://192.168.0.5:3000';
