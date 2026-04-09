import React, { useCallback, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    Alert, 
    Image 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
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

const getRoleName = (role: any): string => {
    if (!role) return '';
    if (typeof role === 'string') return role.toLowerCase();
    if (typeof role.name === 'string') return role.name.toLowerCase();
    return '';
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
    currentCategory?: Category;
}

const CategoryBrowserScreen: React.FC<CategoryBrowserScreenProps> = ({ navigation, route }) => {
    const params = route.params as any;
    const categoryId = params?.categoryId;
    const categoryName = params?.categoryName;

    const [data, setData] = useState<ComponentData>({ subcategories: [], products: [] });
    const [loading, setLoading] = useState(true);
    
    const { user, token } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    
    const role = user?.role || (user as any)?.Role;
    const roleName = getRoleName(role);
    const isAdmin = ['company_admin', 'administrator', 'super_admin'].includes(roleName);

    const handleUnauthorized = () => dispatch(logout());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (!token) {
                throw new Error('Session expired. Please sign in again.');
            }

            if (!categoryId) {
                const res = await apiFetch(`${API_URL}/categories?tree=true`, {}, handleUnauthorized);
                const tree = await readJson(res);

                if (!res.ok) {
                    throw new Error(tree?.message || 'Failed to load categories');
                }

                setData({
                    subcategories: Array.isArray(tree) ? tree : [],
                    products: [],
                });
                return;
            }

            const [catRes, prodRes] = await Promise.all([
                apiFetch(`${API_URL}/categories/${categoryId}`, {}, handleUnauthorized),
                apiFetch(`${API_URL}/products?category=${categoryId}`, {}, handleUnauthorized),
            ]);

            const [category, products] = await Promise.all([readJson(catRes), readJson(prodRes)]);
            if (!catRes.ok) throw new Error(category?.message || 'Failed to load category');
            if (!prodRes.ok) throw new Error(products?.message || 'Failed to load products');

            const productList = Array.isArray(products?.data)
                ? products.data
                : (Array.isArray(products) ? products : []);

            setData({
                subcategories: Array.isArray(category?.children) ? category.children : [],
                products: productList,
                currentCategory: category
            });
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [categoryId, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (categoryName) {
            navigation.setOptions({ title: categoryName });
        }
    }, [categoryName, navigation]);

    useEffect(() => {
        if (isAdmin) {
            navigation.setOptions({
                headerRight: () => (
                    <TouchableOpacity 
                        onPress={() => (navigation as any).navigate('ProductForm')} 
                        style={{ marginRight: 15 }}
                    >
                        <Ionicons name="add" size={28} color={colors.primary} />
                    </TouchableOpacity>
                ),
            });
        } else {
            navigation.setOptions({ headerRight: undefined });
        }
    }, [isAdmin, navigation]);

    const handleCategoryPress = (cat: Category) => {
        if (!cat?.id) return;
        navigation.push('SubCategory', { categoryId: cat.id, categoryName: cat.name });
    };

    const handleEdit = (product: Product) => {
        if (!product?.id) return;
        (navigation as any).navigate('ProductForm', { id: product.id });
    };

    const deleteProduct = async (id: string) => {
        try {
            if (!token) {
                throw new Error('Session expired. Please sign in again.');
            }

            const res = await apiFetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
            }, handleUnauthorized);

            if (res.ok) {
                setData((prev) => ({
                    ...prev,
                    products: prev.products.filter((p) => p.id !== id),
                }));
                Alert.alert('Success', 'Product deleted');
            } else {
                const errData = await readJson(res);
                Alert.alert('Error', errData?.message || 'Failed to delete product');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Network error');
        }
    };

    const handleDelete = (product: Product) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(product.id) },
        ]);
    };

    const renderCategoryItem = ({ item }: { item: Category }) => {
        const isSelected = categoryId === item.id;
        const iconName = getCategoryIcon(item);
        const imageUrl = item.image?.url;

        if (!categoryId) {
            return (
                <TouchableOpacity
                    style={[styles.rootCategoryCard, isSelected && styles.rootCategoryCardActive]}
                    onPress={() => handleCategoryPress(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.rootCategoryIconContainer}>
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl.startsWith('http') ? imageUrl : `${API_URL.replace('/api', '')}${imageUrl}` }}
                                style={styles.rootCategoryIcon}
                                resizeMode="contain"
                            />
                        ) : (
                            <Ionicons name={iconName} size={24} color={colors.primary} />
                        )}
                    </View>
                    <Text style={styles.rootCategoryName} numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={styles.subCategoryCard}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.subCategoryIllustration}>
                    <Ionicons name={iconName} size={40} color={colors.primary} />
                </View>
                <Text style={styles.subCategoryName} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('ProductDetail', { id: item.id, product: item })}
        >
            <View style={styles.productHeader}>
                <Text style={styles.productName}>{formatProductName(item.name, item.manufacturer)}</Text>
                {isAdmin && (
                    <View style={styles.adminActions}>
                        <TouchableOpacity style={styles.tinyAction} onPress={() => handleEdit(item)}>
                            <Ionicons name="pencil" size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tinyAction} onPress={() => handleDelete(item)}>
                            <Ionicons name="trash" size={14} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    {[item.manufacturer, item.modelNumber].filter(Boolean).join(' ') || 'No manufacturer info'}
                </Text>
            </View>
            {item.description ? <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text> : null}
            <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                    {typeof item.category === 'object' ? item.category.name : 'Product'}
                </Text>
            </View>
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
    const hasProducts = data.products.length > 0;

    return (
        <View style={styles.container}>
            {categoryId && data.currentCategory && (
                <View style={styles.headerPanel}>
                    <View style={styles.headerIllustration}>
                        <Ionicons name="settings-outline" size={60} color={colors.primary} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{data.currentCategory.name}</Text>
                        <Text style={styles.headerSubtitle}>
                            {data.currentCategory.description || 'Professional grade category for industrial assistance.'}
                        </Text>
                        <TouchableOpacity style={styles.primaryActionButton}>
                            <Ionicons name="list" size={16} color="white" />
                            <Text style={styles.primaryActionText}>View Tutorials</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FlatList
                ListHeaderComponent={hasSubcategories ? (
                    <Text style={styles.sectionTitle}>{data.subcategories.length} Categories</Text>
                ) : null}
                data={data.subcategories}
                keyExtractor={(item) => `cat_${item.id}`}
                renderItem={renderCategoryItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                ListFooterComponent={hasProducts ? (
                    <View style={{ marginTop: spacing.lg }}>
                        <Text style={styles.sectionTitle}>Products</Text>
                        <FlatList
                            data={data.products}
                            keyExtractor={(item) => `prod_${item.id}`}
                            renderItem={renderProductItem}
                            scrollEnabled={false}
                        />
                    </View>
                ) : null}
                ListEmptyComponent={!hasSubcategories && !hasProducts ? (
                    <View style={styles.empty}>
                        <Ionicons 
                            name="search-outline" 
                            size={48} 
                            color={colors.textMuted} 
                            style={{ marginBottom: spacing.md, opacity: 0.5 }} 
                        />
                        <Text style={styles.emptyTitle}>No items found</Text>
                        <Text style={styles.emptyText}>This search did not return any results.</Text>
                    </View>
                ) : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    list: { padding: spacing.base, paddingBottom: spacing.huge },
    row: { justifyContent: 'space-between' },
    sectionTitle: {
        fontSize: typography.sm.fontSize,
        fontWeight: '800',
        color: colors.textStrong,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
        paddingHorizontal: 2
    },
    headerPanel: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.lg,
        alignItems: 'center'
    },
    headerIllustration: {
        width: 120,
        height: 120,
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.textStrong, marginBottom: 4 },
    headerSubtitle: { fontSize: typography.xs.fontSize, color: colors.textMuted, lineHeight: 16, marginBottom: spacing.md },
    primaryActionButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: radius.sm,
        gap: 8,
        alignSelf: 'flex-start'
    },
    primaryActionText: { color: 'white', fontSize: typography.xs.fontSize, fontWeight: '700' },
    rootCategoryCard: {
        flex: 0.48,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.sm,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    rootCategoryCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    rootCategoryIconContainer: {
        width: 44,
        height: 44,
        borderRadius: radius.sm,
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    rootCategoryIcon: {
        width: '100%',
        height: '100%',
    },
    rootCategoryName: { flex: 1, color: colors.textStrong, fontSize: typography.xs.fontSize, fontWeight: '600' },
    subCategoryCard: {
        flex: 0.48,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        alignItems: 'center',
        paddingBottom: spacing.sm
    },
    subCategoryIllustration: {
        width: '100%',
        aspectRatio: 1.2,
        backgroundColor: colors.surfaceRaised,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center'
    },
    subCategoryName: {
        marginTop: spacing.sm,
        paddingHorizontal: spacing.sm,
        textAlign: 'center',
        color: colors.textStrong,
        fontSize: typography.xs.fontSize,
        fontWeight: '600'
    },
    productCard: {
        backgroundColor: colors.surface,
        padding: spacing.base,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    productName: { color: colors.textStrong, fontSize: typography.bodyBold.fontSize, fontWeight: '700', marginBottom: 2, flex: 1 },
    adminActions: { flexDirection: 'row', gap: 8 },
    tinyAction: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceRaised, justifyContent: 'center', alignItems: 'center' },
    metaRow: { marginBottom: spacing.xs },
    metaText: { color: colors.textMuted, fontSize: typography.sm.fontSize, fontWeight: '500' },
    productDesc: { color: colors.text, fontSize: typography.sm.fontSize, marginBottom: spacing.sm },
    badgeContainer: {
        backgroundColor: colors.surfaceRaised,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border
    },
    badgeText: { color: colors.textMuted, fontSize: typography.xs.fontSize, fontWeight: '600' },
    empty: { alignItems: 'center', paddingVertical: spacing.huge },
    emptyTitle: { fontSize: typography.h4.fontSize, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    emptyText: { fontSize: typography.sm.fontSize, color: colors.textMuted },
});

export default CategoryBrowserScreen;
