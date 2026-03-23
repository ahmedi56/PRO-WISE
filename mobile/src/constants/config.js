import { Platform } from 'react-native';

const getLocalHost = () => {
    return Platform.select({
        android: '10.0.2.2',
        ios: 'localhost',
        default: 'localhost'
    });
};

const DEFAULT_API_URL = `http://${getLocalHost()}:1337/api`;
const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export default API_URL;
