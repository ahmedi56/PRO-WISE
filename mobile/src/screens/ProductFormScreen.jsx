import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography } from '../theme';

const COMPONENT_FIELDS = ['name', 'type', 'manufacturer', 'modelNumber', 'specifications'];

const normalizeComponentRow = (component = {}) => {
    const normalized = {};
    COMPONENT_FIELDS.forEach((field) => {
        normalized[field] = String(component?.[field] || '').trim();
    });
    return normalized;
};

const validateComponentRows = (components = []) => {
    const sanitizedComponents = [];
    const invalidIndexes = [];

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

const getRoleName = (role) => {
    if (!role) return '';
    if (typeof role === 'string') return role.toLowerCase();
    if (typeof role.name === 'string') return role.name.toLowerCase();
    return '';
};

const ProductFormScreen = ({ navigation, route }) => {
    const { id } = route.params || {};
    const isEdit = Boolean(id);
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const roleName = getRoleName(user?.role || user?.Role);
    const hasPermission = roleName === 'company_admin' || roleName === 'administrator';

    // ── State declarations ──────────────────────────────────
    const [formData, setFormData] = useState({
        name: '', description: '', content: '', manufacturer: '', modelNumber: '',
        category: null,
        company: null,
        components: [],
    });
    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
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
        } catch (err) {
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
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComponent = () => {
        setFormData(prev => ({ 
            ...prev, 
            components: [...(prev.components || []), { name: '', type: '', manufacturer: '', modelNumber: '', specifications: '' }] 
        }));
    };

    const handleRemoveComponent = (index) => {
        setFormData(prev => ({ 
            ...prev, 
            components: (prev.components || []).filter((_, i) => i !== index) 
        }));
    };

    const handleComponentChange = (index, field, value) => {
        setFormData(prev => {
            const newComponents = [...(prev.components || [])];
            newComponents[index] = { ...newComponents[index], [field]: value };
            return { ...prev, components: newComponents };
        });
    };

    const renderPickerItem = (item, onPress) => (
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

            <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                    placeholder="Product Name"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(t) => setFormData({ ...formData, description: t })}
                    placeholder="Clear summary. AI uses this for search intent."
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
                    placeholder="Parts, specs, materials... CRITICAL for AI search and related product accuracy."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={6}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Manufacturer</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.manufacturer}
                        onChangeText={(t) => setFormData({ ...formData, manufacturer: t })}
                        placeholder="Brand (Atlas Copco, etc.)"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Model Number</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.modelNumber}
                        onChangeText={(t) => setFormData({ ...formData, modelNumber: t })}
                        placeholder="e.g. GA-55"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>
            </View>

            {/* --- COMPONENTS SECTION --- */}
            <View style={[styles.formGroup, { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 15 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.label, { marginBottom: 0 }]}>Components (AI Context)</Text>
                    <TouchableOpacity onPress={handleAddComponent} style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.surfaceHover, borderRadius: 5 }}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>+ Add</Text>
                    </TouchableOpacity>
                </View>
                
                {(!formData.components || formData.components.length === 0) ? (
                    <Text style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: 10 }}>
                        No components added yet. Each non-empty row should include a component name and at least one of type, brand, model number, or specs.
                    </Text>
                ) : (
                    formData.components.map((comp, index) => (
                        <View key={index} style={{ backgroundColor: colors.surface, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                <Text style={{ fontWeight: 'bold', color: colors.text }}>Component #{index + 1}</Text>
                                <TouchableOpacity onPress={() => handleRemoveComponent(index)}>
                                    <Text style={{ color: colors.error }}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TextInput
                                style={[styles.input, { marginBottom: 8 }]}
                                value={comp.name}
                                onChangeText={(t) => handleComponentChange(index, 'name', t)}
                                placeholder="Component Name *"
                                placeholderTextColor={colors.textMuted}
                            />
                            
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginRight: 5, marginBottom: 8 }]}
                                    value={comp.type}
                                    onChangeText={(t) => handleComponentChange(index, 'type', t)}
                                    placeholder="Type/Category"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1, marginLeft: 5, marginBottom: 8 }]}
                                    value={comp.manufacturer}
                                    onChangeText={(t) => handleComponentChange(index, 'manufacturer', t)}
                                    placeholder="Brand"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <TextInput
                                style={[styles.input, { marginBottom: 8 }]}
                                value={comp.modelNumber}
                                onChangeText={(t) => handleComponentChange(index, 'modelNumber', t)}
                                placeholder="Model Number"
                                placeholderTextColor={colors.textMuted}
                            />
                            
                            <TextInput
                                style={styles.input}
                                value={comp.specifications}
                                onChangeText={(t) => handleComponentChange(index, 'specifications', t)}
                                placeholder="Specifications (e.g. 16GB RAM)"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    ))
                )}
            </View>
            {/* -------------------- */}

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

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>{isEdit ? 'Update Product' : 'Create Product'}</Text>
                )}
            </TouchableOpacity>

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
    button: {
        backgroundColor: colors.primary,
        padding: spacing.base,
        borderRadius: radius.md,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: typography.bodyBold.fontSize },
    modalContainer: { flex: 1, backgroundColor: colors.bg, paddingTop: 50 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.textStrong },
    closeText: { color: colors.primary, fontSize: typography.bodyBold.fontSize, fontWeight: '600' },
    pickerItem: { padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border },
    pickerItemText: { fontSize: typography.body.fontSize, color: colors.textStrong },
});

export default ProductFormScreen;
