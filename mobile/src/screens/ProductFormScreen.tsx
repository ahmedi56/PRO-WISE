import React, { useCallback, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    Modal, 
    FlatList 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../navigation/types';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Component } from '../types/product';
import { Category } from '../types/common';
import { Company } from '../types/company';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const COMPONENT_FIELDS: (keyof Component)[] = ['name', 'type', 'manufacturer', 'modelNumber', 'specifications'];

const normalizeComponentRow = (component: Partial<Component> = {}): Component => {
    const normalized: any = {};
    COMPONENT_FIELDS.forEach((field) => {
        normalized[field] = String(component?.[field] || '').trim();
    });
    return normalized as Component;
};

const validateComponentRows = (components: Component[] = []) => {
    const sanitizedComponents: Component[] = [];
    const invalidIndexes: number[] = [];

    components.forEach((component, index) => {
        const normalized = normalizeComponentRow(component);
        const isEmpty = COMPONENT_FIELDS.every((field) => !normalized[field]);
        if (isEmpty) {
            return;
        }

        const hasPrimaryLabel = !!normalized.name;
        const hasMatchingSignal = !!(normalized.type || normalized.manufacturer || normalized.modelNumber || normalized.specifications);
        if (!hasPrimaryLabel || !hasMatchingSignal) {
            invalidIndexes.push(index);
            return;
        }

        sanitizedComponents.push(normalized);
    });

    return { sanitizedComponents, invalidIndexes };
};

const getRoleName = (role: any): string => {
    if (!role) return '';
    if (typeof role === 'string') return role.toLowerCase();
    if (typeof role.name === 'string') return role.name.toLowerCase();
    return '';
};

type ProductFormRouteProp = RouteProp<RootStackParamList, 'ProductForm'>;
type ProductFormNavigationProp = StackNavigationProp<RootStackParamList, 'ProductForm'>;

interface ProductFormScreenProps {
    navigation: ProductFormNavigationProp;
    route: ProductFormRouteProp;
}

interface ProductFormData {
    name: string;
    description: string;
    content: string;
    manufacturer: string;
    modelNumber: string;
    category: string | null;
    company: string | null;
    components: Component[];
}

const ProductFormScreen: React.FC<ProductFormScreenProps> = ({ navigation, route }) => {
    const { id } = route.params || {};
    const isEdit = Boolean(id);
    const { user, token } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    
    const role = user?.role || (user as any)?.Role;
    const roleName = getRoleName(role);
    const hasPermission = ['company_admin', 'administrator', 'super_admin'].includes(roleName);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '', 
        description: '', 
        content: '', 
        manufacturer: '', 
        modelNumber: '',
        category: null,
        company: null,
        components: [],
    });
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [selectedCompanyName, setSelectedCompanyName] = useState('');
    const [showCatModal, setShowCatModal] = useState(false);
    const [showCompModal, setShowCompModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const handleUnauthorized = () => dispatch(logout());

    const loadDependencies = useCallback(async () => {
        try {
            if (!token) {
                throw new Error('Session expired. Please sign in again.');
            }

            const [catRes, compRes] = await Promise.all([
                apiFetch(`${API_URL}/categories`, {}, handleUnauthorized),
                apiFetch(`${API_URL}/companies`, {}, handleUnauthorized),
            ]);
            const [cats, comps] = await Promise.all([readJson(catRes), readJson(compRes)]);

            if (!catRes.ok) throw new Error(cats?.message || 'Failed to load categories');
            if (!compRes.ok) throw new Error(comps?.message || 'Failed to load companies');

            setCategories(Array.isArray(cats) ? cats : []);
            setCompanies(Array.isArray(comps) ? comps : []);

            if (isEdit) {
                const productRes = await apiFetch(`${API_URL}/products/${id}`, {}, handleUnauthorized);
                const product = await readJson(productRes);
                if (!productRes.ok) {
                    throw new Error(product?.message || 'Failed to load product');
                }

                setFormData({
                    name: product?.name || '',
                    description: product?.description || '',
                    content: product?.content || '',
                    manufacturer: product?.manufacturer || '',
                    modelNumber: product?.modelNumber || '',
                    category: product?.category?.id || product?.category || null,
                    company: product?.company?.id || product?.company || null,
                    components: Array.isArray(product?.components) ? product.components : [],
                });
                setSelectedCategoryName(product?.category?.name || '');
                setSelectedCompanyName(product?.company?.name || '');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load data');
            navigation.goBack();
        } finally {
            setInitialLoading(false);
        }
    }, [id, isEdit, navigation, token]);

    useEffect(() => {
        if (!token) {
            Alert.alert('Session expired', 'Please log in again.');
            navigation.goBack();
            return;
        }
        if (!hasPermission) {
            Alert.alert('Unauthorized', 'You do not have permission to access this screen.');
            navigation.goBack();
            return;
        }
        loadDependencies();
    }, [hasPermission, loadDependencies, navigation, token]);

    const handleSubmit = async () => {
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            Alert.alert('Validation Error', 'Name is required');
            return;
        }

        const { sanitizedComponents, invalidIndexes } = validateComponentRows(formData.components);
        if (invalidIndexes.length > 0) {
            Alert.alert(
                'Validation Error',
                `Component rows ${invalidIndexes.map((index) => index + 1).join(', ')} are incomplete. Each non-empty row needs a name and at least one matching signal.`
            );
            return;
        }
        
        if (!token) {
            Alert.alert('Session expired', 'Please log in again.');
            return;
        }

        setLoading(true);
        try {
            const url = isEdit ? `${API_URL}/products/${id}` : `${API_URL}/products`;
            const method = isEdit ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                name: trimmedName,
                components: sanitizedComponents,
            };

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload),
            }, handleUnauthorized);
            const result = await readJson(res);

            if (!res.ok) {
                throw new Error(result?.message || 'Failed to save product');
            }

            Alert.alert('Success', `Product ${isEdit ? 'updated' : 'created'} successfully`);
            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComponent = () => {
        setFormData(prev => ({ 
            ...prev, 
            components: [...(prev.components || []), { id: `temp-${Date.now()}`, name: '', type: '', manufacturer: '', modelNumber: '', specifications: '' }] 
        }));
    };

    const handleRemoveComponent = (index: number) => {
        setFormData(prev => ({ 
            ...prev, 
            components: (prev.components || []).filter((_, i) => i !== index) 
        }));
    };

    const handleComponentChange = (index: number, field: keyof Component, value: string) => {
        setFormData(prev => {
            const newComponents = [...(prev.components || [])];
            newComponents[index] = { ...newComponents[index], [field]: value };
            return { ...prev, components: newComponents };
        });
    };

    const renderPickerItem = (item: any, onPress: () => void) => (
        <TouchableOpacity style={styles.pickerItem} onPress={onPress}>
            <Text style={styles.pickerItemText}>{item.name || 'Unnamed'}</Text>
        </TouchableOpacity>
    );

    if (initialLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{isEdit ? 'Edit Product' : 'New Product'}</Text>

            <CustomInput
                label="Name *"
                icon="pricetag-outline"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="Product Name"
            />

            <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(t) => setFormData({ ...formData, description: t })}
                    placeholder="Brief summary of the product"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Technical Details / Components</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { height: 120 }]}
                    value={formData.content}
                    onChangeText={(t) => setFormData({ ...formData, content: t })}
                    placeholder="Parts, specs, materials and technical requirements..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={6}
                />
            </View>

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <CustomInput
                        label="Manufacturer"
                        icon="business-outline"
                        value={formData.manufacturer}
                        onChangeText={(t) => setFormData({ ...formData, manufacturer: t })}
                        placeholder="Brand"
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <CustomInput
                        label="Model Number"
                        icon="barcode-outline"
                        value={formData.modelNumber}
                        onChangeText={(t) => setFormData({ ...formData, modelNumber: t })}
                        placeholder="e.g. GA-55"
                    />
                </View>
            </View>

            <View style={[styles.formGroup, { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.label, { marginBottom: 0 }]}>Product Components</Text>
                    <TouchableOpacity 
                        onPress={handleAddComponent} 
                        style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.surfaceContainerHigh, borderRadius: 5 }}
                    >
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>+ Add</Text>
                    </TouchableOpacity>
                </View>
                
                {(!formData.components || formData.components.length === 0) ? (
                    <Text style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: 10 }}>
                        No components added yet. Each non-empty row should include a component name and at least one of type, brand, model number, or specs.
                    </Text>
                ) : (
                    formData.components.map((comp, index) => (
                        <View key={index} style={styles.componentCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, alignItems: 'center' }}>
                                <Text style={{ fontWeight: '600', color: colors.textStrong }}>Component #{index + 1}</Text>
                                <TouchableOpacity onPress={() => handleRemoveComponent(index)}>
                                    <Text style={{ color: colors.error }}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <CustomInput
                                value={comp.name}
                                onChangeText={(t) => handleComponentChange(index, 'name', t)}
                                placeholder="Component Name *"
                            />
                            
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <CustomInput
                                        value={comp.type}
                                        onChangeText={(t) => handleComponentChange(index, 'type', t)}
                                        placeholder="Type/Category"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <CustomInput
                                        value={comp.manufacturer}
                                        onChangeText={(t) => handleComponentChange(index, 'manufacturer', t)}
                                        placeholder="Brand"
                                    />
                                </View>
                            </View>

                            <CustomInput
                                value={comp.modelNumber}
                                onChangeText={(t) => handleComponentChange(index, 'modelNumber', t)}
                                placeholder="Model Number"
                            />
                            
                            <CustomInput
                                value={comp.specifications}
                                onChangeText={(t) => handleComponentChange(index, 'specifications', t)}
                                placeholder="Specifications (e.g. 16GB RAM)"
                            />
                        </View>
                    ))
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCatModal(true)}>
                    <Text style={[styles.pickerButtonText, !formData.category && { color: colors.textMuted }]}>
                        {selectedCategoryName || 'Select Category'}
                    </Text>
                    <Text style={styles.chevron}>v</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Company</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCompModal(true)}>
                    <Text style={[styles.pickerButtonText, !formData.company && { color: colors.textMuted }]}>
                        {selectedCompanyName || 'Select Company'}
                    </Text>
                    <Text style={styles.chevron}>v</Text>
                </TouchableOpacity>
            </View>

            <CustomButton
                title={isEdit ? 'Update Product' : 'Create Product'}
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: spacing.md }}
            />

            <Modal visible={showCatModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <TouchableOpacity onPress={() => setShowCatModal(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={categories}
                        keyExtractor={(item, index) => String(item?.id ?? `${item?.name ?? 'category'}-${index}`)}
                        renderItem={({ item }) => renderPickerItem(item, () => {
                            setFormData({ ...formData, category: item.id });
                            setSelectedCategoryName(item.name || '');
                            setShowCatModal(false);
                        })}
                    />
                </View>
            </Modal>

            <Modal visible={showCompModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Company</Text>
                        <TouchableOpacity onPress={() => setShowCompModal(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={companies}
                        keyExtractor={(item, index) => String(item?.id ?? `${item?.name ?? 'company'}-${index}`)}
                        renderItem={({ item }) => renderPickerItem(item, () => {
                            setFormData({ ...formData, company: item.id });
                            setSelectedCompanyName(item.name || '');
                            setShowCompModal(false);
                        })}
                    />
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.huge },
    title: { fontSize: typography.h2.fontSize, fontWeight: '700', color: colors.textStrong, marginBottom: spacing.xl },
    formGroup: { marginBottom: spacing.lg },
    label: { color: colors.text, marginBottom: spacing.xs, fontWeight: '600' },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.base,
        color: colors.textStrong,
        fontSize: typography.body.fontSize,
    },
    componentCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: spacing.md },
    pickerButton: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.base,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerButtonText: { color: colors.textStrong, fontSize: typography.body.fontSize },
    chevron: { color: colors.textMuted },
    modalContainer: { flex: 1, backgroundColor: colors.bg, paddingTop: 50 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.textStrong },
    closeText: { color: colors.primary, fontSize: typography.bodyBold.fontSize, fontWeight: '600' },
    pickerItem: { padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border },
    pickerItemText: { fontSize: typography.body.fontSize, color: colors.textStrong },
});

export default ProductFormScreen;
