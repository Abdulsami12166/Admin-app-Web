import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../../components/Screen';
import { ListEmpty } from '../../../components/ListEmpty';

export const FeaturesScreen = () => {
  return (
    <Screen
      title="Feature Toggles"
      subtitle="Enable/disable features and manage feature visibility">
      <View style={styles.container}>
        <ListEmpty message="Feature toggles module" />
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
