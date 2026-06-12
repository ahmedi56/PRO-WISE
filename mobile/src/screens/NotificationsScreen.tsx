import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { useDispatch, useSelector } from 'react-redux';

import { logout } from '../store/slices/authSlice';
import { colors, spacing, radius, typography } from '../theme';
import { RootState, AppDispatch } from '../store';
import { notificationService, Notification } from '../services/notificationService';
import CustomButton from '../components/CustomButton';

const NotificationsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;

  const fetchNotifications = async (page: number = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (page === 1) setLoading(true);

      const response = await notificationService.getNotifications(page, LIMIT);
      
      if (page === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
      }

      setUnreadCount(response.pagination.unreadCount);
      setHasMore(response.pagination.total > page * LIMIT);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      if (err instanceof Error && err.message.includes('401')) {
        dispatch(logout());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications(1);
    }, [])
  );

  const handleMarkAsRead = async (notificationId: string, alreadyRead: boolean) => {
    if (alreadyRead) return;

    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchNotifications(currentPage + 1);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return colors.accent;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.primary;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => handleMarkAsRead(item.id, item.read)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        {item.createdAt && (
          <Text style={styles.notificationTime}>
            {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(item.id)}
      >
        <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton
          title="Retry"
          onPress={() => fetchNotifications(1)}
          style={{ marginTop: spacing.xl }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {unreadCount > 0 && notifications.length > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done" size={16} color={colors.primary} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(1, true)}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            hasMore && notifications.length > 0 ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.textStrong,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  markAllText: {
    marginLeft: spacing.sm,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  unreadNotification: {
    backgroundColor: colors.primary + '15',
    borderLeftColor: colors.primary,
  },
  notificationIcon: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: spacing.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textMuted,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textMuted,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});

export default NotificationsScreen;
