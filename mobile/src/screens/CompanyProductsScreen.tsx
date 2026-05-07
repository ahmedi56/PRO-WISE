import React, { useCallback, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { logout } from '../store/slices/authSlice';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { formatProductName } from '../utils/formatProduct';
import { RootState, AppDispatch } from '../store';
import { ShopStackParamList } from '../navigation/types';
import FeedbackSection from '../components/FeedbackSection';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Product } from '../types/product';

type ScreenNavigationProp = StackNavigationProp<ShopStackParamList, 'CompanyProducts'>;
type ScreenRouteProp = RouteProp<ShopStackParamList, 'CompanyProducts'>;

interface CompanyProductsScreenProps {
    navigation: ScreenNavigationProp;
    route: ScreenRouteProp;
}

const CompanyProductsScreen: React.FC<CompanyProductsScreenProps> = ({ navigation, route }) => {
    const { companyId, companyName } = route.params;
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    const { token } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();

    const handleUnauthorized = () => dispatch(logout());

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            if (!token) throw new Error('Session expired');

            const res = await apiFetch(`${API_URL}/products?company=${companyId}&status=published`, {}, handleUnauthorized);
            const data = await readJson(res);

            if (!res.ok) throw new Error(data?.message || 'Failed to load products');

            setProducts(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [companyId, token]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('ProductDetail', { id: item.id, product: item })}
        >
            <View style={styles.productHeader}>
                <Text style={styles.productName}>{formatProductName(item.name, item.manufacturer)}</Text>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    {[item.manufacturer, item.modelNumber].filter(Boolean).join(' ') || 'No manufacturer info'}
                </Text>
            </View>
            {item.description ? <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text> : null}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={renderProductItem}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.headerArea}>
                        <View style={styles.companyInfo}>
                            <Text style={styles.companyNameText}>{companyName}</Text>
                            <FeedbackSection 
                                companyId={companyId} 
                                token={token} 
                                summaryOnly={true}
                                hideTitle={true}
                            />
                        </View>
                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>Products Available</Text>
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.footerArea}>
                        <FeedbackSection 
                            companyId={companyId} 
                            token={token} 
                        />
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyLogoContainer}>
                            <ProWiseLogoSvg width={64} height={64} />
                        </View>
                        <Text style={styles.emptyTitle}>No products found</Text>
                        <Text style={styles.emptyText}>This company has no active products.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: spacing.base, paddingBottom: 110 },
    productCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    productName: { color: colors.textStrong, fontSize: typography.bodyBold.fontSize, fontWeight: '700', marginBottom: 2, flex: 1 },
    metaRow: { marginBottom: spacing.xs },
    metaText: { color: colors.textMuted, fontSize: typography.sm.fontSize, fontWeight: '500' },
    productDesc: { color: colors.text, fontSize: typography.sm.fontSize, marginBottom: spacing.sm },
    empty: { alignItems: 'center', paddingVertical: spacing.huge },
    emptyLogoContainer: {
        marginBottom: spacing.xl,
        opacity: 0.4,
    },
    emptyTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.textStrong, marginBottom: spacing.xs },
    emptyText: { fontSize: typography.body.fontSize, color: colors.textMuted },
    headerArea: {
        marginBottom: spacing.lg,
        paddingTop: spacing.sm,
    },
    companyInfo: {
        marginBottom: spacing.md,
    },
    companyNameText: {
        fontSize: typography.h2.fontSize,
        fontWeight: '800',
        color: colors.textStrong,
        marginBottom: spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },
    sectionTitle: {
        fontSize: typography.h4.fontSize,
        fontWeight: '700',
        color: colors.textStrong,
        marginBottom: spacing.md,
    },
    footerArea: {
        marginTop: spacing.xl,
        paddingTop: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});

export default CompanyProductsScreen;
