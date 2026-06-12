import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const TicketsScreen = () => {
  return (
    <Screen
      title="Support Tickets"
      subtitle="Manage customer support tickets, escalations, and resolutions">
      <View style={styles.container}>
        <ListEmpty message="Support tickets module" />
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
