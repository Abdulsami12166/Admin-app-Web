import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {ListEmpty} from '../../../components/ListEmpty';
import {Screen} from '../../../components/Screen';
import {StatCard} from '../../../components/StatCard';
import {useAdminAuth} from '../../../store/authStore';
import {useDashboardStore} from '../../../store/dashboardStore';
import {palette} from '../../../theme/palette';

export const AdminDashboardScreen = () => {
  const {logout, user} = useAdminAuth();
  const {isRealtimeConnected, isRefreshing, lastSyncAt, metrics, realtimeFeed, refreshAll} =
    useDashboardStore();
  const recentActivities = metrics.recentActivities || [];

  return (
    <Screen
      title="Operations Dashboard"
      subtitle={`Signed in as ${user?.email || 'admin'} | Socket ${isRealtimeConnected ? 'connected' : 'connecting'}.`}
      rightSlot={
        <View style={styles.actions}>
          <ActionButton
            label={isRefreshing ? 'Refreshing...' : 'Refresh'}
            variant="secondary"
            onPress={() => refreshAll().catch(() => {})}
          />
          <ActionButton label="Log Out" variant="secondary" onPress={() => logout()} />
        </View>
      }>
      <View style={styles.grid}>
        <StatCard label="Users" value={metrics.totalUsers || 0} />
        <StatCard label="Orders" value={metrics.totalOrders || 0} accent={palette.accent} />
        <StatCard label="Products" value={metrics.productCount || 0} />
        <StatCard label="Revenue" value={`Rs ${metrics.revenue || 0}`} accent={palette.success} />
      </View>

      <Text style={styles.syncText}>
        {lastSyncAt ? `Last sync ${new Date(lastSyncAt).toLocaleString()}` : 'Sync pending'}
      </Text>

      <Text style={styles.sectionTitle}>Realtime feed</Text>
      {realtimeFeed.length ? (
        realtimeFeed.slice(0, 8).map(item => (
          <InfoCard
            key={item.id}
            title={item.title}
            body={item.detail}
            footer={new Date(item.timestamp).toLocaleString()}
          />
        ))
      ) : (
        <ListEmpty message="Waiting for live user and order activity." />
      )}

      <Text style={styles.sectionTitle}>Recent backend activity</Text>
      {recentActivities.length ? (
        recentActivities.map(activity => (
          <InfoCard
            key={activity._id || `${activity.action}-${activity.createdAt}`}
            title={`${activity.user?.name || 'User'} | ${activity.action || 'activity'}`}
            body={activity.details || 'No details supplied by backend.'}
            footer={activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
          />
        ))
      ) : (
        <ListEmpty message="No recent activities returned by the backend." />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 12,
  },
  syncText: {
    color: palette.muted,
    marginTop: 8,
    marginBottom: 4,
  },
});
