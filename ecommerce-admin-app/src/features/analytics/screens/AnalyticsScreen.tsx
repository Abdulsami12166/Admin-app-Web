import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {Screen} from '../../../components/Screen';
import {StatCard} from '../../../components/StatCard';
import {useDashboardStore} from '../../../store/dashboardStore';
import {palette} from '../../../theme/palette';

export const AnalyticsScreen = () => {
  const {metrics, refreshMetrics} = useDashboardStore();
  const orderStatusEntries = Object.entries(metrics.ordersByStatus || {});

  return (
    <Screen
      title="Analytics"
      subtitle="Backend-driven KPI snapshot for admin leadership and operational follow-up."
      rightSlot={
        <ActionButton
          label="Refresh"
          variant="secondary"
          onPress={() => refreshMetrics().catch(() => {})}
        />
      }>
      <View style={styles.grid}>
        <StatCard label="Blocked Users" value={metrics.blockedUsers || 0} accent={palette.warning} />
        <StatCard label="New Today" value={metrics.newUsersToday || 0} accent={palette.success} />
        <StatCard label="Orders 24h" value={metrics.ordersLast24h || 0} />
        <StatCard label="Active Users 24h" value={metrics.activeUsersLast24h || 0} accent={palette.accent} />
      </View>

      <Text style={styles.heading}>Order mix</Text>
      {orderStatusEntries.map(([status, count]) => (
        <InfoCard key={status} title={status} footer={`${count} orders`} />
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  heading: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
  },
});
