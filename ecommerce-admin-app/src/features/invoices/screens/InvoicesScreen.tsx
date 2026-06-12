import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const InvoicesScreen = () => {
  return (
    <Screen
      title="Invoices & Finance"
      subtitle="Manage invoices, payment logs, and credit notes">
      <View style={styles.container}>
        <ListEmpty message="Invoices and finance module" />
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
