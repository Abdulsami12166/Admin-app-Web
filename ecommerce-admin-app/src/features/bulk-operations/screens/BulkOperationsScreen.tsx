import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const BulkOperationsScreen = () => {
  return (
    <Screen
      title="Bulk Operations"
      subtitle="Perform bulk product actions, pricing updates, and visibility changes">
      <View style={styles.container}>
        <ListEmpty message="Bulk operations module" />
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
