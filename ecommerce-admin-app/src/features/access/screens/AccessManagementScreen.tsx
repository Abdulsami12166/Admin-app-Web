import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {Screen} from '../../../components/Screen';
import {useAdminAuth} from '../../../store/authStore';
import {useDashboardStore} from '../../../store/dashboardStore';
import {palette} from '../../../theme/palette';

const roleMatrix = [
  {
    role: 'Super Admin',
    access: 'Dashboard, RBAC, admins, users, products, orders, analytics, activity',
    note: 'Least privilege owner role',
  },
  {
    role: 'Admin',
    access: 'Users, products, orders, analytics, activity',
    note: 'Operational admin role',
  },
  {
    role: 'Product Manager',
    access: 'Categories, product list, product detail, inventory',
    note: 'Catalog-only role',
  },
  {
    role: 'Support',
    access: 'User detail, orders, tickets, activity logs',
    note: 'Customer support role',
  },
];

const permissionModules = [
  'Dashboard metrics',
  'Role & permission mapping',
  'Admin user management',
  'User block / unblock',
  'Session revoke / force logout',
  'Category show / hide',
  'Product create / edit / publish',
  'Order status updates',
  'Activity audit logs',
];

export const AccessManagementScreen = () => {
  const {logout, user} = useAdminAuth();
  const {isRealtimeConnected, users, activities, refreshAll} = useDashboardStore();
  const adminUsers = users.filter(item => ['admin', 'super-admin', 'super admin'].includes(
    (item.role || '').toLowerCase(),
  ));

  return (
    <Screen
      title="Role & Access"
      subtitle="RBAC checklist, admin sessions, permissions, and security controls for the single-vendor admin panel."
      rightSlot={
        <ActionButton
          label="Refresh"
          variant="secondary"
          onPress={() => refreshAll().catch(() => {})}
        />
      }>
      <View style={styles.statusGrid}>
        <View style={styles.statusCard}>
          <Text style={styles.statusValue}>{user?.role || 'Admin'}</Text>
          <Text style={styles.statusLabel}>Current role</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={[styles.statusValue, {color: isRealtimeConnected ? palette.success : palette.warning}]}>
            {isRealtimeConnected ? 'Active' : 'Syncing'}
          </Text>
          <Text style={styles.statusLabel}>Admin socket</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Role manager</Text>
      {roleMatrix.map(role => (
        <InfoCard
          key={role.role}
          title={role.role}
          body={role.access}
          footer={role.note}
        />
      ))}

      <Text style={styles.sectionTitle}>Permission mapping</Text>
      <View style={styles.permissionCard}>
        {permissionModules.map(module => (
          <View key={module} style={styles.permissionRow}>
            <View style={styles.checkDot}>
              <Text style={styles.checkText}>✓</Text>
            </View>
            <Text style={styles.permissionText}>{module}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Admin users & sessions</Text>
      <InfoCard
        title={`${adminUsers.length || 1} admin account${(adminUsers.length || 1) > 1 ? 's' : ''} monitored`}
        body={`Signed in admin: ${user?.email || 'admin'}\nSession control: logout and force logout are available from auth/user modules.`}
        footer={`Audit entries loaded: ${activities.length}`}
      />
      <ActionButton label="Logout Current Admin" variant="danger" onPress={() => logout()} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statusCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 16,
  },
  statusValue: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  statusLabel: {
    color: palette.muted,
    marginTop: 6,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 12,
  },
  permissionCard: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkText: {
    color: palette.background,
    fontWeight: '900',
  },
  permissionText: {
    color: palette.text,
    flex: 1,
    fontWeight: '700',
  },
});
