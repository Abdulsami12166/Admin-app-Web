import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const ReturnsRefundsScreen = () => {
  return (
    <Screen
      title="Returns & Refunds"
      subtitle="Manage product returns, refunds, and replacements">
      <View style={styles.container}>
        <ListEmpty message="Returns and refunds module" />
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
