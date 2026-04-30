import React, { useEffect, useMemo, useState } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity, 
    Linking, 
    Image,
    Dimensions,
    Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { motion } from 'framer-motion'; // Note: This is for web logic, for mobile we'd use Reanimated, but we use standard RN components with theme tokens here.

import { logout } from '../store/slices/authSlice';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';
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
import FeedbackSection from '../components/FeedbackSection';
import CustomButton from '../components/CustomButton';

const { width } = Dimensions.get('window');

interface ClassifiedMedia extends Media {
    author: string;
    _ctx: {
        guideTitle: string;
        stepTitle: string;
        stepNumber?: number;
    };
    videoId?: string;
    videoUrl?: string;
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
    { key: 'steps', label: 'PROTOCOLS', icon: 'layers-outline' } as const,
    { key: 'videos', label: 'STREAMS', icon: 'videocam-outline' } as const,
    { key: 'pdfs', label: 'TRANSCRIPTS', icon: 'document-text-outline' } as const,
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
            navigation.setOptions({ 
                headerTransparent: true,
                headerTitle: '',
                headerTintColor: colors.textStrong,
                headerBackground: () => (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                )
            });
        }
    }, [data?.name, data?.manufacturer, navigation]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await apiFetch(`${API_URL}/products/${id}`, {}, handleUnauthorized);
                const json = await readJson(res);
                if (!res.ok) throw new Error(json?.message || 'Asset retrieval failed');
                setData(json);
            } catch (err: any) {
                setError(err.message || 'Asset manifest unreachable');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

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
                <Text style={styles.loadingText}>SYNCHRONIZING MANIFEST...</Text>
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorText}>{error || 'Asset Link Terminated'}</Text>
                <CustomButton title="RETURN TO BASE" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.xl }} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* ── Asset Hero ── */}
                <View style={styles.heroSection}>
                    <View style={styles.heroHeader}>
                        <View style={styles.logoBadge}>
                            <ProWiseLogoSvg width={40} height={40} />
                        </View>
                        <View style={styles.heroTitles}>
                            <Text style={styles.manufacturerText}>{data.manufacturer?.toUpperCase() || 'CORE UNIT'}</Text>
                            <Text style={styles.title}>{data.name}</Text>
                            <View style={styles.statusRow}>
                                <View style={styles.statusPill}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>VERIFIED_PROTOCOL</Text>
                                </View>
                                {data.modelNumber && (
                                    <Text style={styles.modelTag}>SN: {data.modelNumber}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Intelligence Grid ── */}
                <View style={styles.intelGrid}>
                    <View style={styles.glassCard}>
                        <Text style={styles.cardHeader}>ASSET SPECIFICATIONS</Text>
                        <Text style={styles.body}>{data.description || 'No primary telemetry registered.'}</Text>
                        
                        <View style={styles.specTable}>
                            <View style={styles.specRow}>
                                <Text style={styles.specKey}>CLASSIFICATION</Text>
                                <Text style={styles.specVal}>{typeof data.category === 'object' ? data.category?.name : 'GENERAL'}</Text>
                            </View>
                            <View style={styles.specRow}>
                                <Text style={styles.specKey}>REGISTRY SOURCE</Text>
                                <Text style={styles.specVal}>{data.company && typeof data.company === 'object' ? data.company.name : 'OEM'}</Text>
                            </View>
                        </View>

                        <FeedbackSection 
                            companyId={typeof data.company === 'object' ? data.company.id : data.company} 
                            productId={data.id}
                            token={token}
                            summaryOnly={true}
                            hideTitle={true}
                        />
                    </View>
                </View>

                {/* ── Component Provisioning ── */}
                <View style={styles.intelGrid}>
                    <View style={styles.glassCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardHeader}>HARDWARE COMPOSITION</Text>
                            <Ionicons name="hardware-chip-outline" size={16} color={colors.primary} />
                        </View>
                        
                        {(data.components || []).length > 0 ? (
                            <View style={styles.componentList}>
                                {data.components?.map((component, index) => {
                                    const selection = buildComponentSelection(component, index);
                                    const isSelected = selectedComponents.some((entry) => entry.selectionKey === selection.selectionKey);
                                    return (
                                        <TouchableOpacity
                                            key={selection.selectionKey}
                                            style={[styles.compNode, isSelected && styles.compNodeSelected]}
                                            onPress={() => toggleComponentSelection(component, index)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.compHeader}>
                                                <Text style={styles.compName}>{component.name}</Text>
                                                {isSelected && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                                            </View>
                                            <Text style={styles.compSpecs}>{component.manufacturer} • {component.type}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>No hardware breakdown detected.</Text>
                        )}
                    </View>
                </View>

                {/* ── Protocol Console ── */}
                <View style={styles.consoleSection}>
                    <View style={styles.consoleHeader}>
                        <Text style={styles.consoleTitle}>OPERATIONS CONSOLE</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
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
                                        <View style={styles.tabPill}>
                                            <Text style={styles.tabPillText}>{(tabCounts as any)[tab.key]}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.consoleContent}>
                        {activeTab === 'steps' && (
                            <View>
                                {data.guides?.length ? (
                                    data.guides.map((guide) => (
                                        <View key={guide.id} style={styles.protocolBlock}>
                                            <Text style={styles.protocolTitle}>{guide.title.toUpperCase()}</Text>
                                            <View style={styles.protocolMeta}>
                                                <Badge tone={guide.difficulty === 'hard' ? 'danger' : 'success'}>{guide.difficulty?.toUpperCase()}</Badge>
                                                <Text style={styles.protocolStat}>{guide.estimatedTime}</Text>
                                            </View>

                                            <View style={styles.timeline}>
                                                {guide.steps?.map((step, idx) => (
                                                    <View key={step.id} style={styles.timelineItem}>
                                                        <View style={styles.timelineIndicator}>
                                                            <View style={styles.timelineNode}>
                                                                <Text style={styles.timelineNum}>{idx + 1}</Text>
                                                            </View>
                                                            {idx < (guide.steps?.length || 0) - 1 && <View style={styles.timelineLine} />}
                                                        </View>
                                                        <View style={styles.timelineContent}>
                                                            <Text style={styles.stepTitle}>{step.title}</Text>
                                                            <Text style={styles.stepDesc}>{step.description}</Text>
                                                            {step.media?.filter(m => m.type === 'image').length > 0 && (
                                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepMedia}>
                                                                    {step.media.filter(m => m.type === 'image').map((img) => (
                                                                        <Image key={img.id} source={{ uri: img.url }} style={styles.stepImage} />
                                                                    ))}
                                                                </ScrollView>
                                                            )}
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>Zero operation protocols registered.</Text>
                                )}
                            </View>
                        )}

                        {activeTab === 'videos' && (
                            <View>
                                {videos.length > 0 ? (
                                    videos.map((vid, idx) => (
                                        <TouchableOpacity 
                                            key={vid.id || idx} 
                                            style={styles.nodeBtn}
                                            onPress={() => vid.url && Linking.openURL(vid.url)}
                                        >
                                            <View style={styles.nodeIcon}>
                                                <Ionicons name="play-circle" size={24} color={colors.primary} />
                                            </View>
                                            <View style={styles.nodeText}>
                                                <Text style={styles.nodeTitle}>{vid.title}</Text>
                                                <Text style={styles.nodeSub}>{vid._ctx.guideTitle}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No multimedia streams detected.</Text>
                                )}
                            </View>
                        )}

                        {activeTab === 'pdfs' && (
                            <View>
                                {pdfs.length > 0 ? (
                                    pdfs.map((pdf, idx) => (
                                        <TouchableOpacity 
                                            key={pdf.id || idx} 
                                            style={styles.nodeBtn}
                                            onPress={() => pdf.url && Linking.openURL(pdf.url)}
                                        >
                                            <View style={styles.nodeIcon}>
                                                <Ionicons name="document-text" size={24} color={colors.primary} />
                                            </View>
                                            <View style={styles.nodeText}>
                                                <Text style={styles.nodeTitle}>{pdf.title}</Text>
                                                <Text style={styles.nodeSub}>Protocol Document • {pdf.author}</Text>
                                            </View>
                                            <Ionicons name="download-outline" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No digital transcripts detected.</Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Intelligence Feed ── */}
                <RecommendationList
                    productId={data.id}
                    categoryId={typeof data.category === 'object' ? data.category?.id : data.category as string}
                    selectedComponents={selectedComponents}
                    title="CROSS-LINKED INTELLIGENCE"
                    onClearSelection={() => setSelectedComponents([])}
                />

                <View style={styles.feedbackContainer}>
                    <FeedbackSection 
                        companyId={typeof data.company === 'object' ? data.company.id : data.company} 
                        productId={data.id}
                        token={token}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 120 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: spacing.md },
    loadingText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
    errorText: { color: colors.error, fontSize: 14, fontWeight: '600', textAlign: 'center' },

    // Hero
    heroSection: {
        paddingTop: 100, // Accommodate transparent header
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        backgroundColor: colors.surfaceRaised,
    },
    heroHeader: { flexDirection: 'row', gap: spacing.md },
    logoBadge: {
        width: 64,
        height: 64,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTitles: { flex: 1 },
    manufacturerText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
    title: { color: colors.textStrong, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 8 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: 'rgba(26, 229, 161, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(26, 229, 161, 0.3)',
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1AE5A1' },
    statusText: { color: '#1AE5A1', fontSize: 10, fontWeight: '800' },
    modelTag: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

    // Intellectual Cards
    intelGrid: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    glassCard: {
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.md },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    body: { color: colors.text, fontSize: 14, lineHeight: 22, marginBottom: spacing.lg },
    specTable: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginBottom: spacing.md },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    specKey: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
    specVal: { color: colors.textStrong, fontSize: 13, fontWeight: '600' },

    // Components
    componentList: { gap: spacing.sm },
    compNode: {
        padding: spacing.md,
        borderRadius: radius.sm,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    compNodeSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    compHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    compName: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
    compSpecs: { color: colors.textMuted, fontSize: 12 },

    // Console Section
    consoleSection: { marginTop: spacing.xl },
    consoleHeader: { paddingHorizontal: spacing.lg },
    consoleTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.md },
    tabScroll: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: colors.primary },
    tabLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
    activeTabLabel: { color: colors.primary },
    tabPill: { backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
    tabPillText: { color: colors.primary, fontSize: 9, fontWeight: '800' },

    consoleContent: { padding: spacing.lg },
    protocolBlock: { marginBottom: spacing.xl },
    protocolTitle: { color: colors.textStrong, fontSize: 16, fontWeight: '800', marginBottom: 8 },
    protocolMeta: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: spacing.xl },
    protocolStat: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
    
    // Timeline
    timeline: { gap: 0 },
    timelineItem: { flexDirection: 'row', gap: spacing.md },
    timelineIndicator: { alignItems: 'center', width: 24 },
    timelineNode: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
    timelineNum: { color: colors.primary, fontSize: 10, fontWeight: '800' },
    timelineLine: { width: 1, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
    timelineContent: { flex: 1, paddingBottom: spacing.xl },
    stepTitle: { color: colors.textStrong, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    stepDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
    stepMedia: { marginTop: spacing.md, flexDirection: 'row' },
    stepImage: { width: 240, height: 140, borderRadius: radius.md, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },

    // Nodes
    nodeBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, gap: spacing.md },
    nodeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    nodeText: { flex: 1 },
    nodeTitle: { color: colors.textStrong, fontSize: 15, fontWeight: '700' },
    nodeSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

    emptyText: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.xl },
    feedbackContainer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});

export default ProductDetailScreen;
