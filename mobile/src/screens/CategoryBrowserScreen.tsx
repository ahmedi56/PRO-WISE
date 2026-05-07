import React, { useCallback, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    Alert, 
    Image,
    Platform 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { BlurView } from 'expo-blur';

import { logout } from '../store/slices/authSlice';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { formatProductName } from '../utils/formatProduct';
import { RootState, AppDispatch } from '../store';
import { ShopStackParamList } from '../navigation/types';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Product } from '../types/product';
import { Category } from '../types/common';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';
import CustomButton from '../components/CustomButton';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'electronics': 'hardware-chip-outline',
    'medical device': 'medkit-outline',
    'camera': 'camera-outline',
    'repair skills': 'build-outline',
    'gaming console': 'game-controller-outline',
    'in the home': 'home-outline',
    'appliances': 'restaurant-outline',
    'mac': 'desktop-outline',
    'computer hardware': 'print-outline',
    'computer': 'laptop-outline',
    'tools': 'hammer-outline',
    'tablet': 'tablet-landscape-outline',
    'phone': 'phone-portrait-outline',
    'vehicle': 'car-outline',
    'apparel & accessories': 'shirt-outline',
    'car and truck': 'bus-outline'
};

const getCategoryIcon = (category: any): keyof typeof Ionicons.glyphMap => {
    let icon = category?.icon;
    if (icon === 'logo-samsung') icon = 'phone-portrait-outline'; 
    if (icon && CATEGORY_ICONS[icon as string]) return icon as keyof typeof Ionicons.glyphMap;

    const normalized = category?.name?.toLowerCase().trim() || '';
    return CATEGORY_ICONS[normalized] || 'cube-outline';
};




type ScreenNavigationProp = StackNavigationProp<ShopStackParamList, 'Categories' | 'SubCategory'>;
type ScreenRouteProp = RouteProp<ShopStackParamList, 'Categories' | 'SubCategory'>;

interface CategoryBrowserScreenProps {
    navigation: ScreenNavigationProp;
    route: ScreenRouteProp;
}

interface ComponentData {
    subcategories: Category[];
    products: Product[];
    companies: any[];
    currentCategory?: Category;
}

const CategoryBrowserScreen: React.FC<CategoryBrowserScreenProps> = ({ navigation, route }) => {
    const params = route.params as any;
    const categoryId = params?.categoryId;
    const categoryName = params?.categoryName;

    const [data, setData] = useState<ComponentData>({ subcategories: [], products: [], companies: [] });
    const [loading, setLoading] = useState(true);
    
    const { user, token } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    


    const handleUnauthorized = () => dispatch(logout());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (!token) throw new Error('Session expired. Please sign in again.');

            if (!categoryId) {
                const res = await apiFetch(`${API_URL}/categories?tree=true`, {}, handleUnauthorized);
                const tree = await readJson(res);
                if (!res.ok) throw new Error(tree?.message || 'Failed to load categories');

                setData({ subcategories: Array.isArray(tree) ? tree : [], products: [], companies: [] });
                return;
            }

            const catRes = await apiFetch(`${API_URL}/categories/${categoryId}`, {}, handleUnauthorized);
            const category = await readJson(catRes);
            if (!catRes.ok) throw new Error(category?.message || 'Failed to load category');

            const hasChildren = Array.isArray(category?.children) && category.children.length > 0;

            if (hasChildren) {
                setData({ subcategories: category.children, products: [], companies: [], currentCategory: category });
            } else {
                const compRes = await apiFetch(`${API_URL}/companies?category=${categoryId}&status=active`, {}, handleUnauthorized);
                const companies = await readJson(compRes);
                if (!compRes.ok) throw new Error(companies?.message || 'Failed to load companies');

                setData({ subcategories: [], products: [], companies: Array.isArray(companies) ? companies : [], currentCategory: category });
            }
        } catch (err: any) {
            Alert.alert('Registry Error', err.message || 'Failed to synchronize registry');
        } finally {
            setLoading(false);
        }
    }, [categoryId, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (categoryName) {
            navigation.setOptions({ 
                title: categoryName.toUpperCase(),
                headerTitleStyle: { ...typography.h3, fontWeight: '900', letterSpacing: 2 },
                headerBackground: () => (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                )
            });
        }
    }, [categoryName, navigation]);



    const handleCategoryPress = (cat: Category) => {
        if (!cat?.id) return;
        navigation.push('SubCategory', { categoryId: cat.id, categoryName: cat.name });
    };

    const handleCompanyPress = (company: any) => {
        navigation.push('CompanyProducts', { companyId: company.id, companyName: company.name });
    };

    const renderCategoryItem = ({ item }: { item: Category }) => {
        const isSelected = categoryId === item.id;
        const iconName = getCategoryIcon(item);
        const imageUrl = item.image?.url;

        return (
            <TouchableOpacity
                style={[styles.nodeCard, isSelected && styles.nodeCardActive]}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.85}
            >
                <View style={styles.nodeIllustration}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl.startsWith('http') ? imageUrl : `${API_URL.replace('/api', '')}${imageUrl}` }}
                            style={styles.nodeImg}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.nodeIconWell}>
                            <Ionicons name={iconName} size={32} color={colors.primary} />
                        </View>
                    )}
                    <View style={styles.nodeOverlay}>
                        <Ionicons name="scan-outline" size={14} color="white" />
                    </View>
                </View>
                <View style={styles.nodeInfo}>
                    <Text style={styles.nodeName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.nodeChildCount}>Sub-Archive</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCompanyItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.entityCard}
            activeOpacity={0.75}
            onPress={() => handleCompanyPress(item)}
        >
            <View style={styles.entityHeader}>
                <View style={styles.entityIconWell}>
                    {item.logo ? (
                        <Image source={{ uri: item.logo }} style={styles.entityLogo} />
                    ) : (
                        <Ionicons name="business" size={24} color={colors.primary} />
                    )}
                </View>
                <View style={styles.entityTitleWell}>
                    <Text style={styles.entityName}>{item.name}</Text>
                    <Text style={styles.entitySub}>Verified Supplier</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            {item.description ? <Text style={styles.entityDesc} numberOfLines={2}>{item.description}</Text> : null}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const hasSubcategories = data.subcategories.length > 0;

    return (
        <View style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <View>
                        {categoryId && data.currentCategory && (
                            <View style={styles.headerPanel}>
                                <View style={styles.logoBadgeContainer}>
                                    <ProWiseLogoSvg width={44} height={44} />
                                </View>
                                <View style={styles.headerInfo}>
                                    <Text style={styles.headerTitle}>{data.currentCategory.name}</Text>
                                    <Text style={styles.headerSubtitle}>{data.currentCategory.description || 'System registry archive for professional grade assets.'}</Text>
                                    <View style={styles.headerActions}>
                                        <View style={styles.headerPill}>
                                            <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                                            <Text style={styles.headerPillText}>VERIFIED_INDEX</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                        {hasSubcategories && (
                            <Text style={styles.sectionTitle}>Foundational Archives</Text>
                        )}
                    </View>
                }
                data={data.subcategories}
                keyExtractor={(item) => `cat_${item.id}`}
                renderItem={renderCategoryItem}
                numColumns={2}
                columnWrapperStyle={hasSubcategories ? styles.row : undefined}
                contentContainerStyle={styles.list}
                ListFooterComponent={
                    <View>
                        {data.companies.length > 0 && (
                            <View style={{ marginTop: spacing.xl }}>
                                <Text style={styles.sectionTitle}>Vendor Registry</Text>
                                <FlatList
                                    data={data.companies}
                                    keyExtractor={(item) => `comp_${item.id}`}
                                    renderItem={renderCompanyItem}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={!hasSubcategories && data.companies.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyLogo}>
                            <ProWiseLogoSvg width={64} height={64} />
                        </View>
                        <Text style={styles.emptyTitle}>Archive Empty</Text>
                        <Text style={styles.emptyText}>Registry synchronization contains no records for this entry.</Text>
                        <CustomButton 
                            title="RETURN TO ARCHIVES" 
                            onPress={() => navigation.goBack()} 
                            variant="outline"
                            style={{ marginTop: spacing.xl }}
                        />
                    </View>
                ) : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    list: { padding: spacing.lg, paddingBottom: 120 },
    row: { justifyContent: 'space-between' },
    


    headerPanel: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoBadgeContainer: {
        width: 72,
        height: 72,
        backgroundColor: colors.bg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textStrong, marginBottom: 4 },
    headerSubtitle: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 10 },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerPill: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4, 
        backgroundColor: colors.primaryLight, 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: radius.full,
        borderWidth: 0.5,
        borderColor: colors.primary
    },
    headerPillText: { fontSize: 8, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 },

    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: spacing.lg,
        paddingHorizontal: 2,
        opacity: 0.8,
    },

    nodeCard: {
        flex: 0.48,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    nodeCardActive: { borderColor: colors.primary },
    nodeIllustration: {
        width: '100%',
        height: 120,
        backgroundColor: colors.surfaceRaised,
        position: 'relative',
    },
    nodeImg: { width: '100%', height: '100%', opacity: 0.8 },
    nodeIconWell: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    nodeOverlay: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        width: 24, 
        height: 24, 
        borderRadius: 12, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    nodeInfo: { padding: spacing.md },
    nodeName: { color: colors.textStrong, fontSize: 13, fontWeight: '800', marginBottom: 2 },
    nodeChildCount: { color: colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },

    entityCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    entityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    entityIconWell: { 
        width: 48, 
        height: 48, 
        borderRadius: 12, 
        backgroundColor: colors.surfaceRaised, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    entityLogo: { width: '100%', height: '100%', borderRadius: 12 },
    entityTitleWell: { flex: 1 },
    entityName: { color: colors.textStrong, fontSize: 16, fontWeight: '800' },
    entitySub: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
    entityDesc: { color: colors.text, fontSize: 13, lineHeight: 20 },

    empty: { alignItems: 'center', paddingVertical: spacing.huge },
    emptyLogo: { marginBottom: spacing.xl, opacity: 0.2 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textStrong, marginBottom: spacing.xs },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.huge },
});

export default CategoryBrowserScreen;
