import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const SettingsScreen = () => {
  return (
    <Screen
      title="Store Settings"
      subtitle="Configure store settings, system parameters, and preferences">
      <View style={styles.container}>
        <ListEmpty message="Store settings module" />
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
