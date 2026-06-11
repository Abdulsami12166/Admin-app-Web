import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {AdminLoginScreen} from '../features/auth/screens/AdminLoginScreen';
import {AdminTabs} from './AdminTabs';
import {useAdminAuth} from '../store/authStore';
import {palette} from '../theme/palette';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const {isAuthenticated, isBootstrapping} = useAdminAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      ) : (
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
});
