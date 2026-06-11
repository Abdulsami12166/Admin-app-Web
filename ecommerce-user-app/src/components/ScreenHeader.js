import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from './AppIcon';
import { useThemeColors } from '../theme/colors';
import { radius } from '../theme/spacing';

const ScreenHeader = ({ title, onBack, rightLabel, onRightPress }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.action} onPress={onBack}>
      <AppIcon icon="back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      {rightLabel ? (
        <TouchableOpacity style={[styles.action, styles.rightAction]} onPress={onRightPress}>
          <Text style={styles.actionLabel} numberOfLines={1}>
            {rightLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const createStyles = colors => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  action: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightAction: {
    minWidth: 58,
    paddingHorizontal: 10,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  placeholder: {
    width: 42,
    height: 42,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
});

export default ScreenHeader;
