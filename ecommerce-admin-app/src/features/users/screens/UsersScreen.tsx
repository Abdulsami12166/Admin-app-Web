import React from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {ListEmpty} from '../../../components/ListEmpty';
import {Screen} from '../../../components/Screen';
import {AdminUser, blockUser, forceLogoutUser, unblockUser} from '../../../services/api/admin';
import {useDashboardStore} from '../../../store/dashboardStore';
import {palette} from '../../../theme/palette';

export const UsersScreen = () => {
  const {refreshUsers, users} = useDashboardStore();
  const verifiedUsers = users.filter(user => user.isVerified).length;
  const blockedUsers = users.filter(user => user.blocked).length;

  async function handleBlockToggle(user: AdminUser) {
    try {
      if (user.blocked) {
        await unblockUser(user._id || user.id || '');
      } else {
        await blockUser(user._id || user.id || '');
      }
      await refreshUsers();
    } catch (error: any) {
      Alert.alert('User action failed', error?.message || 'Could not update this user.');
    }
  }

  async function handleForceLogout(user: AdminUser) {
    try {
      await forceLogoutUser(user._id || user.id || '');
      await refreshUsers();
      Alert.alert('Logout sent', `${user.name || user.email} was asked to sign out.`);
    } catch (error: any) {
      Alert.alert('Logout failed', error?.message || 'Could not force logout.');
    }
  }

  return (
    <Screen
      title="Users Management"
      subtitle="Review verification, account health, and session actions from one place."
      rightSlot={
        <ActionButton
          label="Refresh"
          variant="secondary"
          onPress={() => refreshUsers().catch(() => {})}
        />
      }>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{users.length}</Text>
          <Text style={styles.summaryLabel}>Customers</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, {color: palette.success}]}>{verifiedUsers}</Text>
          <Text style={styles.summaryLabel}>Verified</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, {color: palette.warning}]}>{blockedUsers}</Text>
          <Text style={styles.summaryLabel}>Blocked</Text>
        </View>
      </View>

      {users.length ? (
        users.map(user => (
          <View style={styles.card} key={user._id || user.id || user.email}>
            <InfoCard
              title={`${user.name || 'Unnamed user'} | ${user.role || 'user'}`}
              body={`Profile: ${user.email || 'No email'} | ${user.phone || 'No phone on file'}\nOrders / tickets: open user detail from backend service\nNotification preference: consent enforced`}
              footer={
                user.lastLoginAt
                  ? `Last active ${new Date(user.lastLoginAt).toLocaleString()}`
                  : 'Activity log: no login recorded yet'
              }
            />
            <View style={styles.actions}>
              <ActionButton
                label={user.blocked ? 'Unblock' : 'Block'}
                variant={user.blocked ? 'secondary' : 'danger'}
                onPress={() => handleBlockToggle(user)}
              />
              <ActionButton
                label="Force Logout"
                variant="secondary"
                onPress={() => handleForceLogout(user)}
              />
            </View>
            <Text style={styles.meta}>
              Verified: {user.isVerified ? 'Yes' : 'No'} | Blocked: {user.blocked ? 'Yes' : 'No'} | PII masked in list view
            </Text>
          </View>
        ))
      ) : (
        <ListEmpty message="No users returned by the admin API." />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 12,
  },
  summaryValue: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  summaryLabel: {
    color: palette.muted,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  meta: {
    color: palette.muted,
    marginTop: 10,
    marginLeft: 4,
  },
});
