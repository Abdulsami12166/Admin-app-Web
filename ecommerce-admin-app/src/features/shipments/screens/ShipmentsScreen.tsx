import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const ShipmentsScreen = () => {
  return (
    <Screen
      title="Shipment Management"
      subtitle="Track shipments, manage tracking info, and view delivery status">
      <View style={styles.container}>
        <ListEmpty message="Shipment management module" />
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
