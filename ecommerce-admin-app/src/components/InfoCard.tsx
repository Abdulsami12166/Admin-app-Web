import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {palette} from '../theme/palette';

export const InfoCard = ({
  title,
  body,
  footer,
}: {
  title: string;
  body?: string;
  footer?: string;
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
      {!!footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
  },
  title: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: palette.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  footer: {
    color: palette.accent,
    marginTop: 10,
    fontWeight: '700',
  },
});
