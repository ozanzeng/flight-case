import { Platform } from 'react-native';

// Android emülatöründe host makine 10.0.2.2 üzerinden görünür.
// Fiziksel cihaz için EXPO_PUBLIC_API_URL=http://<LAN-IP>:4000 ile ezilebilir.
const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;

export const PAGE_SIZE = 8;
