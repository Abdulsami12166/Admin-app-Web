import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {palette} from '../theme/palette';

type Props = {
  label: string;
  value: string | number;
  accent?: string;
};

export const StatCard = ({label, value, accent = palette.primary}: Props) => {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, {color: accent}]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
  },
  label: {
    marginTop: 6,
    color: palette.muted,
  },
});
