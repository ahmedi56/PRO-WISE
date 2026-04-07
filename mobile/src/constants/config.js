import { Platform } from 'react-native';

const getLocalHost = () => {
    return Platform.select({
        android: '172.19.220.221',
        ios: '172.19.220.221',
        default: '172.19.220.221'
    });
};

const DEFAULT_API_URL = `http://${getLocalHost()}:1337/api`;
const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export default API_URL;
