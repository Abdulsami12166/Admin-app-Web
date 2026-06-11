import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';

import {palette} from '../theme/palette';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
};

export const ActionButton = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
}: Props) => {
  const buttonStyles = [
    styles.button,
    variant === 'secondary' && styles.secondary,
    variant === 'danger' && styles.danger,
  ];

  return (
    <Pressable disabled={loading} onPress={onPress} style={buttonStyles}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? palette.text : palette.background} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  danger: {
    backgroundColor: palette.danger,
  },
  label: {
    color: palette.background,
    fontWeight: '800',
  },
  secondaryLabel: {
    color: palette.text,
  },
});
