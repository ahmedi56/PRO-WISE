import React, { useEffect, useMemo, useState } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity, 
    Linking, 
    Image 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/slices/authSlice';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography, shadows } from '../theme';
import RecommendationList from '../components/RecommendationList';
import { formatProductName } from '../utils/formatProduct';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../navigation/types';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Product, Component } from '../types/product';
import { Guide, Step, Media } from '../types/common';

interface ClassifiedMedia extends Media {
    author: string;
    _ctx: {
        guideTitle: string;
        stepTitle: string;
        stepNumber?: number;
    };
    videoId?: string;
    videoUrl?: string; // Add this if needed
}

const buildComponentSelection = (component: Component, index: number) => ({
    name: component?.name || '',
    type: component?.type || '',
    manufacturer: component?.manufacturer || '',
    modelNumber: component?.modelNumber || '',
    specifications: component?.specifications || '',
    selectionKey: [
        index,
        component?.name || '',
        component?.type || '',
        component?.manufacturer || '',
        component?.modelNumber || '',
    ].join('|'),
});

const getComponentLabel = (component: any) => {
    const name = component?.name || component?.modelNumber || component?.type || 'Component';
    const brand = component?.manufacturer;
    return brand && !name.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${name}`.trim()
        : name;
};

const classifyMedia = (guides: Guide[] = [], supportVideos: Media[] = [], supportPDFs: Media[] = []) => {
    const videos: ClassifiedMedia[] = [];
    const pdfs: ClassifiedMedia[] = [];

    guides.forEach((guide) => {
        (guide.steps || []).forEach((step) => {
            (step.media || []).forEach((mediaItem) => {
                const context = {
                    guideTitle: guide.title,
                    stepTitle: step.title,
                    stepNumber: step.stepNumber,
                };
                if (mediaItem.type === 'video') {
                    videos.push({ ...mediaItem, author: 'Legacy Support', _ctx: context });
                }
                if (mediaItem.type === 'pdf') {
                    pdfs.push({ ...mediaItem, author: 'Legacy Support', _ctx: context });
                }
            });
        });
    });

    supportVideos.forEach((video) => {
        videos.push({
            id: video.id,
            type: 'video',
            url: video.videoUrl || '',
            videoId: video.videoId,
            videoUrl: video.videoUrl,
            title: video.title,
            author: video.author || 'Internal Support',
            _ctx: { guideTitle: 'Native Support', stepTitle: 'Public Video' }
        });
    });

    supportPDFs.forEach((pdf) => {
        pdfs.push({
            id: pdf.id,
            type: 'pdf',
            title: pdf.title,
            url: pdf.fileUrl || '',
            author: pdf.author || 'Internal Support',
            _ctx: { guideTitle: 'Native Support', stepTitle: 'Public Document' }
        });
    });

    return { videos, pdfs };
};

const SUPPORT_TABS = [
    { key: 'steps', label: 'Steps', icon: 'list-outline' } as const,
    { key: 'videos', label: 'Videos', icon: 'videocam-outline' } as const,
    { key: 'pdfs', label: 'PDFs', icon: 'document-text-outline' } as const,
];

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;

interface ProductDetailScreenProps {
    route: ProductDetailRouteProp;
    navigation: ProductDetailNavigationProp;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ route, navigation }) => {
    const { id, product } = route.params || {};
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    
    const [data, setData] = useState<Product | null>(product || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedComponents, setSelectedComponents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'steps' | 'videos' | 'pdfs'>('steps');

    const handleUnauthorized = () => dispatch(logout());

    useEffect(() => {
        if (data?.name) {
            navigation.setOptions({ title: formatProductName(data.name, data.manufacturer) });
        }
    }, [data?.name, data?.manufacturer, navigation]);

    useEffect(() => {
        setSelectedComponents([]);
    }, [id]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await apiFetch(`${API_URL}/products/${id}`, {}, handleUnauthorized);
                const json = await readJson(res);

                if (!res.ok) {
                    throw new Error(json?.message || 'Failed to load product');
                }

                setData(json);
            } catch (err: any) {
                setError(err.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const toggleComponentSelection = (component: Component, index: number) => {
        const nextSelection = buildComponentSelection(component, index);
        setSelectedComponents((previous) => (
            previous.some((entry) => entry.selectionKey === nextSelection.selectionKey)
                ? previous.filter((entry) => entry.selectionKey !== nextSelection.selectionKey)
                : [...previous, nextSelection]
        ));
    };

    const { videos, pdfs } = useMemo(() => 
        classifyMedia(data?.guides, (data as any)?.supportVideos, (data as any)?.supportPDFs), 
    [data]);

    const tabCounts = useMemo(() => ({
        steps: (data?.guides || []).reduce((count, guide) => count + (guide.steps?.length || 0), 0),
        videos: videos.length,
        pdfs: pdfs.length,
    }), [data?.guides, videos, pdfs]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error || 'Product not found'}</Text>
            </View>
        );
    }

    const guides = data.guides || [];
    const components = data.components || [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="cube-outline" size={32} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{formatProductName(data.name, data.manufacturer)}</Text>
                    <Text style={styles.subtitle}>
                        {[data.manufacturer, data.modelNumber].filter(Boolean).join(' - ') || 'General product'}
                    </Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.body}>{data.description || 'No description available.'}</Text>
                {data.content ? <Text style={[styles.body, styles.detailBody]}>{data.content}</Text> : null}
            </View>

            <View style={styles.row}>
                <View style={[styles.card, styles.metaCard]}>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.value}>{typeof data.category === 'object' ? data.category?.name : 'N/A'}</Text>
                </View>
                <View style={[styles.card, styles.metaCard]}>
                    <Text style={styles.label}>Company</Text>
                    <Text style={styles.value}>{data.company && typeof data.company === 'object' ? data.company.name : 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Technical Components</Text>
                <Text style={styles.helperText}>
                    Tap one or more components to find finished products built with matching parts.
                </Text>

                {components.length > 0 ? (
                    <View style={styles.componentList}>
                        {components.map((component, index) => {
                            const selection = buildComponentSelection(component, index);
                            const isSelected = selectedComponents.some((entry) => entry.selectionKey === selection.selectionKey);

                            return (
                                <TouchableOpacity
                                    key={selection.selectionKey}
                                    style={[styles.componentCard, isSelected && styles.componentCardSelected]}
                                    onPress={() => toggleComponentSelection(component, index)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.componentHeader}>
                                        <Text style={styles.componentName}>{component.name || 'Component'}</Text>
                                        {component.type ? (
                                            <View style={styles.componentBadge}>
                                                <Text style={styles.componentBadgeText}>{component.type}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    {(component.manufacturer || component.modelNumber) ? (
                                        <Text style={styles.componentMeta}>
                                            {[component.manufacturer, component.modelNumber].filter(Boolean).join(' - ')}
                                        </Text>
                                    ) : null}
                                    {component.specifications ? (
                                        <Text style={styles.componentSpecs}>{component.specifications}</Text>
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <Text style={styles.bodyTextMuted}>No component breakdown available yet.</Text>
                )}

                {selectedComponents.length > 0 ? (
                    <View style={styles.selectionRow}>
                        <View style={styles.selectionWrap}>
                            {selectedComponents.map((component) => (
                                <View key={component.selectionKey} style={styles.selectionChip}>
                                    <Text style={styles.selectionChipText}>{getComponentLabel(component)}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity onPress={() => setSelectedComponents([])} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>

            <View style={styles.card}>
                <View style={styles.supportHeader}>
                    <Text style={styles.sectionTitle}>Repair Guides & Support</Text>
                    <View style={styles.tabsContainer}>
                        {SUPPORT_TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Ionicons 
                                    name={tab.icon} 
                                    size={18} 
                                    color={activeTab === tab.key ? colors.primary : colors.textMuted} 
                                />
                                <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                                    {tab.label}
                                </Text>
                                {(tabCounts as any)[tab.key] > 0 && (
                                    <View style={styles.tabBadge}>
                                        <Text style={styles.tabBadgeText}>{(tabCounts as any)[tab.key]}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {activeTab === 'steps' && (
                    <View style={styles.tabPanel}>
                        {guides.length > 0 ? (
                            guides.map((guide) => (
                                <View key={guide.id} style={styles.guideBlock}>
                                    <View style={styles.guideHeader}>
                                        <Text style={styles.guideTitle}>{guide.title}</Text>
                                        <View style={styles.guideMetaRow}>
                                            <View style={[styles.badge, { backgroundColor: guide.difficulty === 'hard' ? colors.errorLight : guide.difficulty === 'medium' ? colors.warningLight : colors.successLight }]}>
                                                <Text style={[styles.badgeText, { color: guide.difficulty === 'hard' ? colors.error : guide.difficulty === 'medium' ? colors.warning : colors.success }]}>
                                                    {guide.difficulty?.toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={styles.guideMetaText}>{guide.estimatedTime || 'N/A'}</Text>
                                            <Text style={styles.guideMetaText}>{guide.steps?.length || 0} Steps</Text>
                                        </View>
                                    </View>

                                    {guide.steps && guide.steps.length > 0 ? (
                                        <View style={styles.stepsList}>
                                            {guide.steps.map((step, index) => {
                                                const images = (step.media || []).filter(m => m.type === 'image');
                                                return (
                                                    <View key={step.id} style={styles.stepItem}>
                                                        <View style={styles.stepIndicator}>
                                                            <View style={styles.stepCircle}>
                                                                <Text style={styles.stepNumber}>{index + 1}</Text>
                                                            </View>
                                                            {index < (guide.steps?.length || 0) - 1 && <View style={styles.stepLine} />}
                                                        </View>
                                                        <View style={styles.stepContent}>
                                                            <Text style={styles.stepTitle}>{step.title}</Text>
                                                            {step.description ? <Text style={styles.stepDesc}>{step.description}</Text> : null}
                                                            {images.length > 0 && (
                                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepGallery}>
                                                                    {images.map((img) => (
                                                                        <Image 
                                                                            key={img.id} 
                                                                            source={{ uri: img.url }} 
                                                                            style={styles.stepImage} 
                                                                            resizeMode="cover"
                                                                        />
                                                                    ))}
                                                                </ScrollView>
                                                            )}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <Text style={styles.emptyText}>No steps available for this guide.</Text>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No repair guides available yet.</Text>
                        )}
                    </View>
                )}

                {activeTab === 'videos' && (
                    <View style={styles.tabPanel}>
                        {videos.length > 0 ? (
                            videos.map((video, index) => (
                                <TouchableOpacity 
                                    key={video.id || index} 
                                    style={styles.mediaRow}
                                    onPress={() => {
                                        const url = video.videoUrl || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : video.url);
                                        if (url) Linking.openURL(url);
                                    }}
                                >
                                    <View style={styles.videoThumbnailPlaceholder}>
                                        <Ionicons name="play-circle-outline" size={32} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.mediaTitle}>{video.title || 'Support Video'}</Text>
                                        <Text style={styles.mediaSub}>{video._ctx.guideTitle} • {video.author}</Text>
                                    </View>
                                    <Ionicons name="open-outline" size={20} color={colors.textMuted} />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No support videos available.</Text>
                        )}
                    </View>
                )}

                {activeTab === 'pdfs' && (
                    <View style={styles.tabPanel}>
                        {pdfs.length > 0 ? (
                            pdfs.map((pdf, index) => (
                                <TouchableOpacity 
                                    key={pdf.id || index} 
                                    style={styles.mediaRow}
                                    onPress={() => {
                                        const fullUrl = (pdf.url && (pdf.url.startsWith('http') || pdf.url.startsWith('//'))) 
                                            ? pdf.url 
                                            : `${API_URL}${pdf.url}?token=${token}`;
                                        Linking.openURL(fullUrl);
                                    }}
                                >
                                    <View style={styles.pdfIconPlaceholder}>
                                        <Text style={styles.pdfIconText}>PDF</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.mediaTitle}>{pdf.title || 'Document'}</Text>
                                        <Text style={styles.mediaSub}>{pdf._ctx.guideTitle} • {pdf.author}</Text>
                                    </View>
                                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No PDF resources available.</Text>
                        )}
                    </View>
                )}
            </View>

            <RecommendationList
                productId={data.id}
                categoryId={typeof data.category === 'object' ? data.category?.id : data.category as string}
                selectedComponents={selectedComponents}
                title={selectedComponents.length > 0 ? 'Products Matching Selected Components' : 'Recommended Similar Models'}
                onClearSelection={() => setSelectedComponents([])}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.huge },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: radius.lg,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    title: { fontSize: typography.h2.fontSize, fontWeight: '700', color: colors.textStrong },
    subtitle: { fontSize: typography.body.fontSize, color: colors.textMuted },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    metaCard: { flex: 1 },
    row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    sectionTitle: { fontSize: typography.h4.fontSize, fontWeight: '600', color: colors.textStrong, marginBottom: spacing.sm },
    helperText: { fontSize: typography.sm.fontSize, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
    body: { fontSize: typography.body.fontSize, color: colors.text, lineHeight: 24 },
    detailBody: { marginTop: spacing.md, color: colors.textMuted },
    bodyTextMuted: { fontSize: typography.body.fontSize, color: colors.textMuted, fontStyle: 'italic' },
    label: { fontSize: typography.xs.fontSize, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
    value: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, fontWeight: '600' },
    componentList: { gap: spacing.sm },
    componentCard: {
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
    },
    componentCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    componentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: spacing.sm },
    componentName: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, fontWeight: '700', flex: 1 },
    componentBadge: {
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    componentBadgeText: { fontSize: typography.xs.fontSize, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
    componentMeta: { fontSize: typography.sm.fontSize, color: colors.text, marginBottom: 4 },
    componentSpecs: { fontSize: typography.sm.fontSize, color: colors.textMuted, lineHeight: 18 },
    selectionRow: { marginTop: spacing.md, gap: spacing.sm },
    selectionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    selectionChip: {
        backgroundColor: colors.primaryLight,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    selectionChipText: { color: colors.primary, fontSize: typography.xs.fontSize, fontWeight: '700' },
    clearButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6 },
    clearButtonText: { color: colors.primary, fontWeight: '700' },
    errorText: { fontSize: typography.body.fontSize, color: colors.error, textAlign: 'center' },
    supportHeader: { marginBottom: spacing.lg },
    tabsContainer: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: colors.primary },
    tabLabel: { fontSize: typography.sm.fontSize, color: colors.textMuted, fontWeight: '600' },
    activeTabLabel: { color: colors.primary, fontWeight: '700' },
    tabBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 2 },
    tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    tabPanel: { marginTop: spacing.md },
    guideBlock: { marginBottom: spacing.xl, backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
    guideHeader: { marginBottom: spacing.lg },
    guideTitle: { fontSize: typography.bodyBold.fontSize, fontWeight: '700', color: colors.textStrong, marginBottom: 4 },
    guideMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    guideMetaText: { fontSize: typography.xs.fontSize, color: colors.textMuted },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, fontWeight: '800' },
    stepsList: { marginTop: spacing.sm },
    stepItem: { flexDirection: 'row', gap: spacing.md },
    stepIndicator: { alignItems: 'center', width: 24 },
    stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    stepNumber: { color: '#fff', fontSize: 12, fontWeight: '800' },
    stepLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
    stepContent: { flex: 1, paddingBottom: spacing.xl },
    stepTitle: { fontSize: typography.bodyBold.fontSize, fontWeight: '600', color: colors.textStrong, marginBottom: 4 },
    stepDesc: { fontSize: typography.sm.fontSize, color: colors.textMuted, lineHeight: 20 },
    stepGallery: { marginTop: spacing.md, flexDirection: 'row' },
    stepImage: { width: 200, height: 120, borderRadius: radius.md, marginRight: spacing.sm, backgroundColor: '#000' },
    mediaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
    mediaTitle: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.textStrong },
    mediaSub: { fontSize: typography.xs.fontSize, color: colors.textMuted, marginTop: 2 },
    videoThumbnailPlaceholder: { width: 60, height: 40, backgroundColor: colors.primaryLight, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
    pdfIconPlaceholder: { width: 40, height: 40, backgroundColor: colors.primaryLight, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    pdfIconText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
    emptyText: { textAlign: 'center', color: colors.textMuted, fontStyle: 'italic', paddingVertical: spacing.xl },
});

export default ProductDetailScreen;
