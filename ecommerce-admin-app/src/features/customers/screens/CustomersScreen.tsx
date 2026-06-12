import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const CustomersScreen = () => {
  return (
    <Screen
      title="Customer Management"
      subtitle="View and manage customer accounts, activity logs, and notification preferences">
      <View style={styles.container}>
        <ListEmpty message="Customer management module" />
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
