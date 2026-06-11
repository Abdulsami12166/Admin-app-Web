import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';

import {palette} from '../theme/palette';

type Props = React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  scroll?: boolean;
  rightSlot?: React.ReactNode;
}>;

export const Screen = ({children, title, subtitle, scroll = true, rightSlot}: Props) => {
  const content = (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightSlot}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? <ScrollView style={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: palette.muted,
    lineHeight: 20,
  },
});
