import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';
import { readJson } from '../utils/apiSettings';
import ProductSkeleton from '../components/ui/Skeleton/ProductSkeleton';

const SearchScreen = ({ navigation }: any) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length > 2) {
                performSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {}, undefined);
            const data = await readJson(res);
            if (res.ok) {
                const searchData = data.data || data;
                setResults(searchData.products || []);
            }
        } catch (err) {
            console.error("Search error", err);
        } finally {
            setLoading(false);
        }
    };

    const renderResult = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.resultCard, shadows.sm]}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id, product: item })}
        >
            <View style={styles.iconBox}>
                <Ionicons name="cube-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.textStrong }]}>{item.name}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {item.category?.name || 'ASSET'} • VERSION 1.0
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <CustomInput 
                    placeholder="ENTER SYSTEM QUERY..."
                    autoFocus
                    value={query}
                    onChangeText={setQuery}
                    icon="search"
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>QUERYING ARCHIVES...</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderResult}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        query.length > 2 ? (
                            <View style={styles.center}>
                                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>NO ASSETS MATCHING QUERY</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: spacing.lg, paddingBottom: 0 },
    list: { padding: spacing.lg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    loadingText: { marginTop: spacing.md, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    emptyText: { marginTop: spacing.md, fontWeight: '700' },
    resultCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.surfaceContainer, 
        padding: spacing.md, 
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    iconBox: { 
        width: 48, 
        height: 48, 
        borderRadius: radius.md, 
        backgroundColor: `${colors.primary}1A`, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginRight: spacing.md
    },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '800' },
    meta: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 }
});

export default SearchScreen;
