import React, { useEffect, useMemo, useState, useRef } from 'react';
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
    Platform,
    TextInput,
    Modal
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
// import { motion } from 'framer-motion'; // Removed web-only library from mobile screen
import MarkdownRenderer from '../components/MarkdownRenderer';

import { logout } from '../store/slices/authSlice';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography, shadows } from '../theme';
import RecommendationList from '../components/RecommendationList';
import { productService } from '../services/productService';
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

/**
 * Normalize a media URL to an absolute URL.
 * If the URL is already absolute (http/https), return as-is.
 * If relative, prepend the backend base URL derived from API_URL.
 */
const resolveMediaUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // API_URL is like 'https://prowise-backend.onrender.com/api'
    const backendBase = API_URL.replace(/\/api\/?$/, '');
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
    return `${backendBase}${apiPath}`;
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
                    videos.push({ ...mediaItem, url: resolveMediaUrl(mediaItem.url), author: 'Legacy Support', _ctx: context });
                }
                if (mediaItem.type === 'pdf') {
                    pdfs.push({ ...mediaItem, url: resolveMediaUrl(mediaItem.url), author: 'Legacy Support', _ctx: context });
                }
            });
        });
    });

    supportVideos.forEach((video) => {
        videos.push({
            id: video.id,
            type: 'video',
            url: video.videoUrl || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : ''),
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
            url: resolveMediaUrl(pdf.fileUrl) || '',
            author: pdf.author || 'Internal Support',
            _ctx: { guideTitle: 'Technical Protocol', stepTitle: 'Official Documentation' }
        });
    });

    return { videos, pdfs };
};

const TOP_TABS = [
    { key: 'manifest', label: 'MANIFEST', icon: 'document-text-outline' } as const,
    { key: 'hardware', label: 'HARDWARE', icon: 'hardware-chip-outline' } as const,
    { key: 'protocols', label: 'PROTOCOLS', icon: 'layers-outline' } as const,
    { key: 'videos', label: 'VIDEOS', icon: 'videocam-outline' } as const,
    { key: 'docs', label: 'DOCS', icon: 'document-outline' } as const,
];

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;

interface ProductDetailScreenProps {
    route: ProductDetailRouteProp;
    navigation: ProductDetailNavigationProp;
}

const Badge: React.FC<{ children: React.ReactNode; tone?: 'success' | 'danger' | 'warning' | 'info' }> = ({ children, tone = 'info' }) => {
    const toneColors = {
        success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: colors.accent },
        danger: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.2)', text: colors.error },
        warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: colors.warning },
        info: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)', text: colors.primary },
    };

    const style = (toneColors as any)[tone] || toneColors.info;
    return (
        <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: radius.sm,
            backgroundColor: style.bg,
            borderWidth: 1,
            borderColor: style.border,
        }}>
            <Text style={{ color: style.text, fontSize: 10, fontWeight: '800' }}>{children}</Text>
        </View>
    );
};

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ route, navigation }) => {
    const { id, product } = route.params || {};
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useSelector((state: RootState) => state.auth);
    
    const [data, setData] = useState<Product | null>(product || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedComponents, setSelectedComponents] = useState<any[]>([]);
    const [insights, setInsights] = useState<Record<string, string>>({});
    const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<'manifest' | 'hardware' | 'protocols' | 'videos' | 'docs'>('manifest');

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ type: 'query' | 'result'; text: string }>>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Initialize welcome message once product data is loaded
    useEffect(() => {
        if (data) {
            setSearchResults([
                { type: 'result', text: `Welcome to PRO-WISE Semantic Search. Search for troubleshooting steps, maintenance recommendations, and product documentation for ${formatProductName(data.name, data.manufacturer)}.` }
            ]);
        }
    }, [data]);

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) return;

        setSearchQuery('');
        setSearchResults(prev => [...prev, { type: 'query', text: query }]);
        setSearchLoading(true);

        try {
            const res = await apiFetch(`${API_URL}/ai/search`, {
                method: 'POST',
                body: JSON.stringify({
                    message: query,
                    productId: id
                })
            }, handleUnauthorized);
            
            const json = await readJson(res);
            const reply = json?.data?.response || json?.data?.text || "No relevant results found. Please try a different search query.";
            setSearchResults(prev => [...prev, { type: 'result', text: reply }]);
        } catch (error) {
            console.error('Semantic search error:', error);
            setSearchResults(prev => [...prev, { type: 'result', text: "The search service is temporarily unavailable. Please try again later." }]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleUnauthorized = () => dispatch(logout());

    const toggleComponentSelection = (component: Component, index: number) => {
        const selection = buildComponentSelection(component, index);
        const exists = selectedComponents.some((entry) => entry.selectionKey === selection.selectionKey);
        if (exists) {
            setSelectedComponents(selectedComponents.filter((entry) => entry.selectionKey !== selection.selectionKey));
        } else {
            setSelectedComponents([...selectedComponents, selection]);
        }
    };

    useEffect(() => {
        selectedComponents.forEach((component) => {
            const key = component.selectionKey;
            if (!insights[key] && !loadingInsights[key]) {
                setLoadingInsights(prev => ({ ...prev, [key]: true }));
                productService.getComponentInsight(component, data?.name || '')
                    .then((insight) => {
                        setInsights(prev => ({ ...prev, [key]: insight }));
                    })
                    .catch((err) => {
                        console.error('Error fetching component insight in mobile:', err);
                        const type = (component.type || '').toLowerCase();
                        const name = component.name || '';
                        const manufacturer = component.manufacturer || '';
                        const specs = component.specifications || '';
                        let fallback = `The ${name} is a key ${component.type || 'component'} configured for this system.`;
                        if (type.includes('cpu') || type.includes('processor') || name.toLowerCase().includes('intel') || name.toLowerCase().includes('amd') || name.toLowerCase().includes('ryzen') || name.toLowerCase().includes('core i') || name.toLowerCase().includes('m1') || name.toLowerCase().includes('m2') || name.toLowerCase().includes('m3')) {
                            fallback = `The ${name} serves as the central processing unit (CPU), directing all system operations and executing computational threads.`;
                        } else if (type.includes('gpu') || type.includes('graphics') || name.toLowerCase().includes('nvidia') || name.toLowerCase().includes('rtx') || name.toLowerCase().includes('radeon') || name.toLowerCase().includes('geforce')) {
                            fallback = `The ${name} is the dedicated GPU, delivering high-performance graphics rendering for gaming, design rendering, and display output.`;
                        } else if (type.includes('ram') || type.includes('memory') || name.toLowerCase().includes('ddr') || name.toLowerCase().includes('sodimm')) {
                            fallback = `The ${name} serves as active system memory (RAM), holding temporary data for running applications and system processes.`;
                        } else if (specs) {
                            fallback = `Configured specifications: ${specs}`;
                        }
                        setInsights(prev => ({ ...prev, [key]: fallback }));
                    })
                    .finally(() => {
                        setLoadingInsights(prev => ({ ...prev, [key]: false }));
                    });
            }
        });
    }, [selectedComponents, data, insights, loadingInsights]);

    useEffect(() => {
        if (data?.name) {
            navigation.setOptions({ 
                headerTransparent: true,
                headerTitle: '',
                headerTintColor: colors.textStrong,
                headerBackground: () => (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.flatten(StyleSheet.absoluteFill)} />
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
            {/* ── Fixed Header ── */}
            <View style={styles.tabBarContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
                    {TOP_TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.topTab, activeTab === tab.key && styles.activeTopTab]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons 
                                name={tab.icon} 
                                size={18} 
                                color={activeTab === tab.key ? colors.primary : colors.textMuted} 
                            />
                            <Text style={[styles.topTabLabel, activeTab === tab.key && styles.activeTopTabLabel]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {activeTab === 'manifest' && (
                    <View style={styles.pageContent}>
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

                        {/* ── Product Description ── */}
                        <View style={styles.sectionWrapper}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionIconWell}>
                                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                            </View>
                            <View style={styles.glassCard}>
                                <MarkdownRenderer text={data.description || 'No primary telemetry registered.'} textStyle={styles.body} />
                            </View>
                        </View>

                        {/* ── Specs & Classification ── */}
                        <View style={styles.sectionWrapper}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionIconWell}>
                                    <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.sectionLabel}>SPECIFICATIONS</Text>
                            </View>
                            <View style={styles.glassCard}>
                                <View style={styles.specTable}>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specKey}>CLASSIFICATION</Text>
                                        <Text style={styles.specVal}>{typeof data.category === 'object' ? data.category?.name : 'GENERAL'}</Text>
                                    </View>
                                    <View style={styles.specDivider} />
                                    <View style={styles.specRow}>
                                        <Text style={styles.specKey}>REGISTRY SOURCE</Text>
                                        <Text style={styles.specVal}>{data.company && typeof data.company === 'object' ? data.company.name : 'OEM'}</Text>
                                    </View>
                                    {data.modelNumber && (
                                        <><View style={styles.specDivider} />
                                        <View style={styles.specRow}>
                                            <Text style={styles.specKey}>MODEL NUMBER</Text>
                                            <Text style={styles.specVal}>{data.modelNumber}</Text>
                                        </View></>
                                    )}
                                    {data.manufacturer && (
                                        <><View style={styles.specDivider} />
                                        <View style={styles.specRow}>
                                            <Text style={styles.specKey}>MANUFACTURER</Text>
                                            <Text style={styles.specVal}>{data.manufacturer}</Text>
                                        </View></>
                                    )}
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

                        <View style={styles.feedbackContainer}>
                            <FeedbackSection 
                                companyId={typeof data.company === 'object' ? data.company.id : data.company} 
                                productId={data.id}
                                token={token}
                            />
                        </View>
                    </View>
                )}

                {activeTab === 'hardware' && (
                    <View style={styles.pageContent}>
                        <View style={styles.sectionWrapper}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionIconWell}>
                                    <Ionicons name="hardware-chip-outline" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.sectionLabel}>COMPONENTS</Text>
                                {(data.components || []).length > 0 && (
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countBadgeText}>{data.components?.length}</Text>
                                    </View>
                                )}
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
                                                <View style={styles.compIconRow}>
                                                    <View style={styles.compIconWell}>
                                                        <Ionicons name="cube-outline" size={18} color={isSelected ? colors.primary : colors.textMuted} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={styles.compHeader}>
                                                            <Text style={styles.compName}>{component.name}</Text>
                                                            {isSelected && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                                                        </View>
                                                        <Text style={styles.compSpecs}>{component.manufacturer} • {component.type}</Text>
                                                        {component.modelNumber && <Text style={styles.compModel}>SN: {component.modelNumber}</Text>}
                                                        {component.specifications ? (
                                                            <Text style={styles.compDescription} numberOfLines={3}>
                                                                {component.specifications}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Ionicons name="cube-outline" size={32} color={colors.textMuted} style={{ opacity: 0.4 }} />
                                    <Text style={styles.emptyText}>No hardware breakdown detected.</Text>
                                </View>
                            )}
                        </View>

                        {/* ── Technical Instructions Panel for Selected Components ── */}
                        {selectedComponents.length > 0 && (
                            <View style={styles.compSelectedSection}>
                                <View style={styles.compSelectedTitleRow}>
                                    <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                                    <Text style={styles.compSelectedTitle}>TECHNICAL INSTRUCTIONS</Text>
                                    <Text style={styles.compSelectedCount}>{selectedComponents.length} Selected</Text>
                                </View>
                                <View style={styles.compSelectedCards}>
                                    {selectedComponents.map((component) => (
                                        <View key={component.selectionKey} style={styles.compSelectedCard}>
                                            <View style={styles.compSelectedCardHeader}>
                                                <View style={{ flex: 1, marginRight: 8 }}>
                                                    <Text style={styles.compSelectedCardName}>{component.name}</Text>
                                                    <Text style={styles.compSelectedCardMeta}>
                                                        {component.manufacturer} {component.modelNumber ? `• SN: ${component.modelNumber}` : ''}
                                                    </Text>
                                                </View>
                                                {component.type && (
                                                    <View style={styles.compSelectedCardBadge}>
                                                        <Text style={styles.compSelectedCardBadgeText}>{component.type}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.compSelectedCardSpecs}>
                                                {component.specifications || 'No detailed specifications or instructions are registered for this component.'}
                                            </Text>

                                            {/* AI Technical Insight Box */}
                                            <View style={styles.compSelectedAiBox}>
                                                <View style={styles.compSelectedAiHeader}>
                                                    <Ionicons name="sparkles-outline" size={13} color={colors.success || '#10B981'} />
                                                    <Text style={styles.compSelectedAiTitle}>AI TECHNICAL INSIGHT</Text>
                                                </View>
                                                {loadingInsights[component.selectionKey] ? (
                                                    <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                                                ) : (
                                                    <MarkdownRenderer 
                                                        text={insights[component.selectionKey] || 'Loading insight...'}
                                                        textStyle={styles.compSelectedAiText}
                                                    />
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                        
                        <RecommendationList
                            productId={data.id}
                            categoryId={typeof data.category === 'object' ? data.category?.id : data.category as string}
                            selectedComponents={selectedComponents}
                            title="CROSS-LINKED INTELLIGENCE"
                            onClearSelection={() => setSelectedComponents([])}
                        />
                    </View>
                )}

                {activeTab === 'protocols' && (
                    <View style={styles.pageContent}>
                        <View style={styles.sectionWrapper}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionIconWell}>
                                    <Ionicons name="layers-outline" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.sectionLabel}>OPERATION PROTOCOLS</Text>
                            </View>
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
                                                                    <Image key={img.id} source={{ uri: resolveMediaUrl(img.url) }} style={styles.stepImage} />
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
                                <View style={styles.emptyCard}>
                                    <Ionicons name="layers-outline" size={32} color={colors.textMuted} style={{ opacity: 0.4 }} />
                                    <Text style={styles.emptyText}>Zero operation protocols registered.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'videos' && (
                    <View style={styles.pageContent}>
                        <View style={styles.sectionWrapper}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionIconWell}>
                                    <Ionicons name="videocam-outline" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.sectionLabel}>VIDEO STREAMS</Text>
                            </View>
                            
                            {videos.length > 0 ? (
                                videos.map((vid, idx) => {
                                    const isYouTube = vid.url?.includes('youtube.com') || vid.url?.includes('youtu.be') || vid.videoId;
                                    return (
                                        <TouchableOpacity 
                                            key={vid.id || idx} 
                                            style={styles.nodeBtn}
                                            onPress={() => vid.url && WebBrowser.openBrowserAsync(vid.url)}
                                        >
                                            <View style={styles.nodeIcon}>
                                                <Ionicons name={isYouTube ? "logo-youtube" : "play-circle"} size={24} color={isYouTube ? "#FF0000" : colors.primary} />
                                            </View>
                                            <View style={styles.nodeText}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={styles.nodeTitle}>{vid.title}</Text>
                                                    {isYouTube && <Badge tone="danger">YOUTUBE</Badge>}
                                                </View>
                                                <Text style={styles.nodeSub}>{vid._ctx.guideTitle} • {vid.author}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Ionicons name="videocam-outline" size={32} color={colors.textMuted} style={{ opacity: 0.4 }} />
                                    <Text style={styles.emptyText}>No video streams detected.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'docs' && (
                    <View style={styles.pageContent}>
                        <View style={styles.sectionWrapper}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionIconWell}>
                                    <Ionicons name="document-outline" size={18} color={colors.primary} />
                                </View>
                                <Text style={styles.sectionLabel}>DIGITAL TRANSCRIPTS</Text>
                            </View>
                            
                            {pdfs.length > 0 ? (
                                pdfs.map((pdf, idx) => (
                                    <TouchableOpacity 
                                        key={pdf.id || idx} 
                                        style={styles.nodeBtn}
                                        onPress={() => pdf.url && WebBrowser.openBrowserAsync(pdf.url)}
                                    >
                                        <View style={styles.nodeIcon}>
                                            <Ionicons name="document-text" size={24} color={colors.primary} />
                                        </View>
                                        <View style={styles.nodeText}>
                                            <Text style={styles.nodeTitle}>{pdf.title}</Text>
                                            <Text style={styles.nodeSub}>{pdf._ctx.guideTitle} • {pdf.author}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>OPEN</Text>
                                            <Ionicons name="open-outline" size={16} color={colors.primary} />
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Ionicons name="document-outline" size={32} color={colors.textMuted} style={{ opacity: 0.4 }} />
                                    <Text style={styles.emptyText}>No digital transcripts detected.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* FLOATING SEMANTIC SEARCH BUTTON */}
            <TouchableOpacity
                onPress={() => setIsSearchOpen(true)}
                style={{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    zIndex: 1000
                }}
            >
                <Ionicons name="sparkles" size={24} color="#fff" />
            </TouchableOpacity>

            {/* SEMANTIC SEARCH MODAL */}
            <Modal
                visible={isSearchOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsSearchOpen(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    justifyContent: 'flex-end'
                }}>
                    <BlurView intensity={30} style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View style={{
                            backgroundColor: colors.surfaceContainer,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            height: '80%',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.08)',
                            overflow: 'hidden'
                        }}>
                            {/* Header */}
                            <LinearGradient
                                colors={[colors.primary, '#312e81']}
                                style={{
                                    padding: 16,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Ionicons name="search" size={18} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Product Knowledge Search</Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Semantic Search · RAG</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={{ padding: 4 }}>
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </LinearGradient>

                            {/* Messages */}
                            <ScrollView 
                                contentContainerStyle={{ padding: 16, gap: 16 }}
                                ref={scrollViewRef}
                                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            >
                                {searchResults.map((item, index) => (
                                    item.type === 'query' ? (
                                        <View key={index} style={{
                                            flexDirection: 'row',
                                            alignSelf: 'flex-end',
                                            backgroundColor: colors.primary,
                                            padding: 12,
                                            borderRadius: 16,
                                            borderBottomRightRadius: 2,
                                            maxWidth: '80%'
                                        }}>
                                            <Text style={{ color: '#fff', fontSize: 14 }}>{item.text}</Text>
                                        </View>
                                    ) : (
                                        <View key={index} style={{
                                            backgroundColor: colors.surfaceRaised,
                                            padding: 14,
                                            borderRadius: 16,
                                            borderBottomLeftRadius: 2,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            borderLeftWidth: 4,
                                            borderLeftColor: colors.primary,
                                            maxWidth: '90%'
                                        }}>
                                            <MarkdownRenderer text={item.text} textStyle={{ color: colors.textStrong, fontSize: 14, lineHeight: 20 }} />
                                        </View>
                                    )
                                ))}
                                {searchLoading && (
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        backgroundColor: colors.surfaceRaised,
                                        padding: 14,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        alignSelf: 'flex-start'
                                    }}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Searching product manuals...</Text>
                                    </View>
                                )}
                            </ScrollView>

                            {/* Input Area */}
                            <View style={{
                                padding: 16,
                                borderTopWidth: 1,
                                borderTopColor: colors.border,
                                backgroundColor: colors.surfaceContainerHigh,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12
                            }}>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        backgroundColor: colors.surface,
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        fontSize: 14,
                                        color: colors.textStrong,
                                        borderWidth: 1,
                                        borderColor: colors.border
                                    }}
                                    placeholder="Search manuals, guides..."
                                    placeholderTextColor={colors.textMuted}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                <TouchableOpacity 
                                    onPress={handleSearch}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        backgroundColor: colors.primary,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Ionicons name="arrow-up" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    // Tab Bar
    tabBarContainer: {
        backgroundColor: colors.surfaceContainer,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: Platform.OS === 'ios' ? 100 : 80, // Increased to clear the back button
    },
    tabBarScroll: {
        paddingHorizontal: spacing.md,
    },
    topTab: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activeTopTab: {
        borderBottomColor: colors.primary,
    },
    topTabLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    activeTopTabLabel: {
        color: colors.primary,
    },

    pageContent: {
        flex: 1,
        paddingBottom: 40,
    },

    // Hero
    heroSection: {
        paddingTop: spacing.md, 
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
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
    statusText: { color: colors.accent, fontSize: 10, fontWeight: '800' },

    modelTag: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

    // Section Layout
    sectionWrapper: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    sectionIconWell: {
        width: 32, height: 32, borderRadius: radius.sm,
        backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    },
    sectionLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, flex: 1 },
    sectionDivider: {
        height: 1, backgroundColor: colors.border,
        marginHorizontal: spacing.lg, marginTop: spacing.xl,
    },
    countBadge: {
        backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary,
    },
    countBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
    glassCard: {
        padding: spacing.lg, borderRadius: radius.lg,
        backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border,
    },
    body: { color: colors.text, fontSize: 14, lineHeight: 24 },
    specTable: { gap: 0 },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    specDivider: { height: 1, backgroundColor: colors.border },
    specKey: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    specVal: { color: colors.textStrong, fontSize: 13, fontWeight: '600' },

    // Components
    componentList: { gap: spacing.sm },
    compNode: {
        padding: spacing.md, borderRadius: radius.lg,
        backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border,
    },
    compNodeSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    compIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    compIconWell: {
        width: 36, height: 36, borderRadius: radius.md,
        backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center',
    },
    compHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    compName: { color: colors.textStrong, fontSize: 14, fontWeight: '700' },
    compSpecs: { color: colors.textMuted, fontSize: 12 },
    compModel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
    emptyCard: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },

    // Media
    subSectionTitle: { color: colors.textStrong, fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.sm },
    emptyTextSmall: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', paddingVertical: spacing.md },

    // Operations
    protocolBlock: { marginBottom: spacing.xl, backgroundColor: colors.surfaceContainer, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
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
    feedbackContainer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xl },
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 120 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: spacing.md },
    loadingText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
    errorText: { color: colors.error, fontSize: 14, fontWeight: '600', textAlign: 'center' },

    // Component specifications styling
    compDescription: {
        color: colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },
    compSelectedSection: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    compSelectedTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.sm,
    },
    compSelectedTitle: {
        color: colors.textStrong,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
        flex: 1,
    },
    compSelectedCount: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: '800',
    },
    compSelectedCards: {
        gap: spacing.md,
    },
    compSelectedCard: {
        backgroundColor: colors.surfaceContainer,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    compSelectedCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    compSelectedCardName: {
        color: colors.textStrong,
        fontSize: 14,
        fontWeight: '700',
    },
    compSelectedCardMeta: {
        color: colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    compSelectedCardBadge: {
        backgroundColor: colors.primaryLight,
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    compSelectedCardBadgeText: {
        color: colors.primary,
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    compSelectedCardSpecs: {
        color: colors.text,
        fontSize: 13,
        lineHeight: 20,
        marginTop: spacing.sm,
    },
    compSelectedAiBox: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.bg || '#F9FAFB',
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: colors.success || '#10B981',
    },
    compSelectedAiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 6,
    },
    compSelectedAiTitle: {
        color: colors.textStrong,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    compSelectedAiText: {
        color: colors.text,
        fontSize: 12,
        lineHeight: 18,
    },
});

export default ProductDetailScreen;
