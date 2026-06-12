import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const InventoryScreen = () => {
  return (
    <Screen
      title="Inventory Management"
      subtitle="Manage stock levels, low-stock alerts, and warehouse locations">
      <View style={styles.container}>
        <ListEmpty message="Inventory management module" />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
