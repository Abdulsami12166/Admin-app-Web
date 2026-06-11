import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {palette} from '../theme/palette';

export const ListEmpty = ({message}: {message: string}) => (
  <View style={styles.card}>
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 18,
  },
  text: {
    color: palette.muted,
    textAlign: 'center',
  },
});
