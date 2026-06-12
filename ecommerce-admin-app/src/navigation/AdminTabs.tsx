import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {AccessManagementScreen} from '../features/access/screens/AccessManagementScreen';
import {ActivityScreen} from '../features/activity/screens/ActivityScreen';
import {AnalyticsScreen} from '../features/analytics/screens/AnalyticsScreen';
import {AdminDashboardScreen} from '../features/dashboard/screens/AdminDashboardScreen';
import {OrdersScreen} from '../features/orders/screens/OrdersScreen';
import {ProductsScreen} from '../features/products/screens/ProductsScreen';
import {UsersScreen} from '../features/users/screens/UsersScreen';
import {CustomersScreen} from '../features/customers/screens/CustomersScreen';
import {InventoryScreen} from '../features/inventory/screens/InventoryScreen';
import {ShipmentsScreen} from '../features/shipments/screens/ShipmentsScreen';
import {TicketsScreen} from '../features/tickets/screens/TicketsScreen';
import {InvoicesScreen} from '../features/invoices/screens/InvoicesScreen';
import {ReturnsRefundsScreen} from '../features/returns-refunds/screens/ReturnsRefundsScreen';
import {AuditLogsScreen} from '../features/audit-logs/screens/AuditLogsScreen';
import {SettingsScreen} from '../features/settings/screens/SettingsScreen';
import {FeaturesScreen} from '../features/features/screens/FeaturesScreen';
import {NotificationsScreen} from '../features/notifications/screens/NotificationsScreen';
import {SessionsScreen} from '../features/sessions/screens/SessionsScreen';
import {OrderTimelineScreen} from '../features/order-timeline/screens/OrderTimelineScreen';
import {BulkOperationsScreen} from '../features/bulk-operations/screens/BulkOperationsScreen';
import {palette} from '../theme/palette';

//all navigation for admin app is hereee
const tabs = [
  {key: 'Dashboard', component: AdminDashboardScreen},
  {key: 'Access', component: AccessManagementScreen},
  {key: 'Users', component: UsersScreen},
  {key: 'Customers', component: CustomersScreen},
  {key: 'Products', component: ProductsScreen},
  {key: 'Orders', component: OrdersScreen},
  {key: 'Timeline', component: OrderTimelineScreen},
  {key: 'Inventory', component: InventoryScreen},
  {key: 'Shipments', component: ShipmentsScreen},
  {key: 'Tickets', component: TicketsScreen},
  {key: 'Returns', component: ReturnsRefundsScreen},
  {key: 'Invoices', component: InvoicesScreen},
  {key: 'Analytics', component: AnalyticsScreen},
  {key: 'Audit', component: AuditLogsScreen},
  {key: 'Settings', component: SettingsScreen},
  {key: 'Features', component: FeaturesScreen},
  {key: 'Notify', component: NotificationsScreen},
  {key: 'Sessions', component: SessionsScreen},
  {key: 'Bulk Ops', component: BulkOperationsScreen},
  {key: 'Activity', component: ActivityScreen},
] as const;

export const AdminTabs = () => {
  const [activeTab, setActiveTab] = React.useState<(typeof tabs)[number]['key']>('Dashboard');
  const ActiveScreen = tabs.find(tab => tab.key === activeTab)?.component || AdminDashboardScreen;
//const ActiveScreen = tabs.find(tab => tab.key === activeTab)?.component || AdminDashboardScreen;
  return (
    <View style={styles.shell}>
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}>
          {tabs.map(tab => {
            const active = tab.key === activeTab;
            //const active = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.activeTab]}>
                <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{tab.key}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.content}>
        <ActiveScreen />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: palette.background,
  },
  tabBar: {
    backgroundColor: palette.background,
    paddingTop: 18,
    paddingBottom: 4,
    //paddingTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  tabRow: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 2,
    //paddingHorizontal: 12,
    backgroundColor: palette.background,
    alignItems: 'center',
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    height: 28,
    paddingHorizontal: 14,
    paddingVertical: 0,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  tabLabel: {
    color: palette.muted,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 12,
  },
  activeTabLabel: {
    color: palette.background,
  },
  content: {
    flex: 1,
  },
});
