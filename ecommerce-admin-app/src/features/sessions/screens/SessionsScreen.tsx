import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const SessionsScreen = () => {
  return (
    <Screen
      title="Session Management"
      subtitle="View active sessions, manage user sessions, and force logout">
      <View style={styles.container}>
        <ListEmpty message="Session management module" />
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
