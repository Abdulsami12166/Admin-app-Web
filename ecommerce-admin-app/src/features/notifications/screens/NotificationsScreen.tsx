import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const NotificationsScreen = () => {
  return (
    <Screen
      title="Notifications"
      subtitle="Manage notification templates, rules, and logs">
      <View style={styles.container}>
        <ListEmpty message="Notifications module" />
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
