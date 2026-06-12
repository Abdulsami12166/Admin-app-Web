import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const OrderTimelineScreen = () => {
  return (
    <Screen
      title="Order Timeline"
      subtitle="View complete order lifecycle and event history">
      <View style={styles.container}>
        <ListEmpty message="Order timeline module" />
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
