import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const AuditLogsScreen = () => {
  return (
    <Screen
      title="Audit Logs"
      subtitle="View system audit logs and admin actions">
      <View style={styles.container}>
        <ListEmpty message="Audit logs module" />
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
