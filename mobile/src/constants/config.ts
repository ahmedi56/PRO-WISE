import { Platform } from 'react-native';

const getLocalHost = (): string => {
    return Platform.select({
        android: '192.168.100.252',
        ios: '192.168.100.252',
        default: '192.168.100.252'
    });
};

const DEFAULT_API_URL = `http://${getLocalHost()}:1337/api`;
const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export default API_URL;
