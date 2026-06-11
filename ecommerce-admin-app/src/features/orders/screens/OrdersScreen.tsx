import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';

import {ActionButton} from '../../../components/ActionButton';
import {InfoCard} from '../../../components/InfoCard';
import {ListEmpty} from '../../../components/ListEmpty';
import {Screen} from '../../../components/Screen';
import {AdminOrder, updateOrderStatus} from '../../../services/api/admin';
import {useDashboardStore} from '../../../store/dashboardStore';

const nextStatusMap: Record<string, string> = {
  pending: 'processing',
  paid: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export const OrdersScreen = () => {
  const {orders, refreshOrders} = useDashboardStore();

  async function handleAdvanceStatus(order: AdminOrder) {
    try {
      const nextStatus = nextStatusMap[order.orderStatus || 'pending'] || 'processing';
      await updateOrderStatus(order._id, {orderStatus: nextStatus});
      await refreshOrders();
    } catch (error: any) {
      Alert.alert('Order update failed', error?.message || 'Could not update order status.');
    }
  }

  return (
    <Screen
      title="Orders Management"
      subtitle="Track live purchases and fulfillment progression. Payment transactions are intentionally excluded."
      rightSlot={
        <ActionButton
          label="Refresh"
          variant="secondary"
          onPress={() => refreshOrders().catch(() => {})}
        />
      }>
      {orders.length ? (
        orders.map(order => (
          <View style={styles.card} key={order._id}>
            <InfoCard
              title={`${order.user?.name || 'Customer'} | ${order.orderStatus || 'pending'}`}
              body={`Amount: Rs ${order.totalAmount || 0}\nItems: ${
                order.items?.map(item => `${item.quantity || 0}x ${item.title || 'item'}`).join(', ') || 'n/a'
              }`}
              footer={order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
            />
            <ActionButton label="Advance Status" onPress={() => handleAdvanceStatus(order)} />
          </View>
        ))
      ) : (
        <ListEmpty message="No orders returned by the admin API." />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
});
