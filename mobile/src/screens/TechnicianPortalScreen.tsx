import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Alert, 
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

const TechnicianPortalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = async () => {
        try {
            const data = await maintenanceService.getTechnicianRequests();
            setRequests(data);
        } catch (err: any) {
            console.error('Failed to load requests:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await maintenanceService.updateRequestStatus(id, status);
            fetchRequests();
            Alert.alert('Protocol Updated', `Mission status changed to: ${status.replace('_', ' ')}`);
        } catch (err: any) {
            Alert.alert('Status Error', 'Failed to synchronize mission update.');
        }
    };

    const renderRequestItem = ({ item }: { item: any }) => {
        const isMine = item.technician?.id === user?.id;
        const canAccept = item.status === 'pending';
        const canStart = item.status === 'assigned' && isMine;
        const canComplete = item.status === 'in_progress' && isMine;

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
                    <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{item.user?.name || 'Client'}</Text>
                    <View style={styles.dot} />
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                </View>

                <View style={styles.cardActions}>
                    {canAccept && (
                        <CustomButton 
                            title="Accept Mission" 
                            size="small" 
                            onPress={() => handleUpdateStatus(item.id, 'assigned')} 
                        />
                    )}
                    {canStart && (
                        <CustomButton 
                            title="Initialize Repair" 
                            size="small" 
                            onPress={() => handleUpdateStatus(item.id, 'in_progress')} 
                        />
                    )}
                    {canComplete && (
                        <CustomButton 
                            title="Finalize & Close" 
                            size="small" 
                            variant="primary"
                            onPress={() => handleUpdateStatus(item.id, 'completed')} 
                        />
                    )}
                    {isMine && item.status !== 'completed' && (
                        <View style={styles.assignedIndicator}>
                            <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                            <Text style={styles.assignedText}>ACTIVE TASK</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'assigned': return '#3b82f6';
            case 'in_progress': return colors.primary;
            case 'completed': return '#10b981';
            default: return colors.textMuted;
        }
    };

    const completedCount = requests.filter(r => r.status === 'completed' && r.technician?.id === user?.id).length;
    const activeCount = requests.filter(r => (r.status === 'assigned' || r.status === 'in_progress') && r.technician?.id === user?.id).length;

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
                <Text style={styles.title}>Tech Command</Text>
                <Text style={styles.subtitle}>Fleet management and mission control</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{completedCount}</Text>
                    <Text style={styles.statLabel}>COMPLETED</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: colors.accent }]}>{activeCount}</Text>
                    <Text style={styles.statLabel}>ACTIVE</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: '#f59e0b' }]}>{requests.filter(r => r.status === 'pending').length}</Text>
                    <Text style={styles.statLabel}>POOL</Text>
                </View>
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
                            <Ionicons name="scan-outline" size={48} color={colors.glassBorder} />
                            <Text style={styles.emptyText}>No available missions in proximity.</Text>
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
    title: { ...typography.h1, color: colors.textStrong },
    subtitle: { ...typography.body, color: colors.textMuted },
    statsRow: { 
        flexDirection: 'row', 
        paddingHorizontal: spacing.lg, 
        gap: spacing.md, 
        marginBottom: spacing.xl 
    },
    statBox: { 
        flex: 1, 
        backgroundColor: colors.surfaceContainer, 
        borderRadius: radius.lg, 
        padding: spacing.md, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm
    },
    statVal: { ...typography.h2, color: colors.primary },
    statLabel: { ...typography.caption, fontSize: 8, marginTop: 2 },
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
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
    metaText: { ...typography.sm, color: colors.textMuted, fontSize: 12 },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.glassBorder },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    assignedIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    assignedText: { ...typography.caption, color: colors.primary, fontWeight: '700', fontSize: 10 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { paddingVertical: spacing.huge, alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
});

export default TechnicianPortalScreen;
