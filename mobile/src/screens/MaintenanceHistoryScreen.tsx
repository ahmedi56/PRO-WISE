import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { maintenanceService } from '../services/maintenanceService';
import { RootState } from '../store';
import { formatDate } from '../utils/mobileHelpers';
import CustomButton from '../components/CustomButton';

const MaintenanceHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = async () => {
        try {
            const data = await maintenanceService.getUserRequests();
            setRequests(data);
        } catch (err: any) {
            console.error('Failed to load user requests:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRequests();
        });
        return unsubscribe;
    }, [navigation]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'assigned': return '#3b82f6';
            case 'in_progress': return colors.primary;
            case 'completed': return '#10b981';
            default: return colors.textMuted;
        }
    };

    const renderRequestItem = ({ item }: { item: any }) => {
        return (
            <View style={styles.requestCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.typeTag}>
                        <Text style={styles.typeText}>{item.productName.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <Text style={styles.issueTitle}>{item.issueDescription}</Text>
                
                <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                    
                    {item.technician && (
                        <>
                            <View style={styles.dot} />
                            <Ionicons name="build-outline" size={14} color={colors.primary} />
                            <Text style={styles.metaText}>
                                Tech: {item.technician.name || 'Assigned'}
                            </Text>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.secondary, colors.bg]}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
                </TouchableOpacity>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>Support Log</Text>
                    <TouchableOpacity 
                        style={styles.newRequestBtn} 
                        onPress={() => navigation.navigate('MaintenanceRequest')}
                    >
                        <Ionicons name="add-circle" size={32} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Track your registered hardware maintenance requests</Text>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequestItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => {
                            setRefreshing(true);
                            fetchRequests();
                        }} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="construct-outline" size={48} color={colors.glassBorder} />
                            <Text style={styles.emptyText}>No registered service requests.</Text>
                            <CustomButton 
                                title="File New Request" 
                                onPress={() => navigation.navigate('MaintenanceRequest')}
                                style={{ marginTop: spacing.lg }}
                            />
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    background: { ...StyleSheet.absoluteFillObject, opacity: 0.1 },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.huge, marginBottom: spacing.lg },
    backBtn: { marginBottom: spacing.md },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { ...typography.h1, color: colors.textStrong },
    newRequestBtn: { padding: 4 },
    subtitle: { ...typography.body, color: colors.textMuted, marginTop: 4 },
    listContent: { padding: spacing.lg, paddingBottom: spacing.huge },
    requestCard: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.md
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    typeTag: { backgroundColor: colors.glass, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.xs },
    typeText: { ...typography.caption, fontSize: 9, color: colors.textStrong, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
    statusText: { ...typography.caption, fontWeight: '700', fontSize: 10 },
    issueTitle: { ...typography.bodyBold, color: colors.textStrong, marginBottom: spacing.sm },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { ...typography.sm, color: colors.textMuted, fontSize: 12 },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.glassBorder },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { paddingVertical: spacing.huge, alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
});

export default MaintenanceHistoryScreen;
