import { apiFetch } from '../utils/api';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'PREFETCH_';
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

class PrefetchService {
    static async prefetchProduct(id: string) {
        try {
            // Check cache first
            const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${id}`);
            if (cached) {
                const { timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) return; // Still fresh
            }

            console.log(`[Prefetch] Fetching data for: ${id}`);
            const res = await apiFetch(`${API_URL}/products/${id}`, {}, undefined);
            const data = await readJson(res);

            if (res.ok) {
                await AsyncStorage.setItem(`${CACHE_PREFIX}${id}`, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            }
        } catch (err) {
            console.warn(`[Prefetch] Failed for ${id}:`, err);
        }
    }

    static async prefetchMultiple(ids: string[]) {
        // Limit concurrency to avoid blocking UI thread
        const chunk = ids.slice(0, 5); 
        await Promise.all(chunk.map(id => this.prefetchProduct(id)));
    }

    static async getCachedProduct(id: string) {
        try {
            const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${id}`);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) return data;
            }
        } catch (err) {
            return null;
        }
        return null;
    }
}

export default PrefetchService;
