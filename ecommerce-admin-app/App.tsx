import React from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppProviders} from './src/app/AppProviders';
import {RootNavigator} from './src/navigation/RootNavigator';
import {palette} from './src/theme/palette';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    primary: palette.primary,
    notification: palette.accent,
  },
};

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={palette.background} />
      <AppProviders>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AppProviders>
    </SafeAreaProvider>
  );
};

export default App;
