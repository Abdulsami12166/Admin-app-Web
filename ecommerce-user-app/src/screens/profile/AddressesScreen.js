import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const AddressesScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { savedAddresses, selectAddress } = useAppStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Saved Address" onBack={() => navigation.goBack()} />
        {!savedAddresses.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No delivery address added yet</Text>
            <Text style={styles.emptyBody}>
              Add your home, street, town, pincode, and precise location so checkout stays accurate.
            </Text>
          </View>
        ) : null}
        {savedAddresses.map(address => (
          <React.Fragment key={address.id}>
            <TouchableOpacity
              style={[styles.card, address.selected && styles.selectedCard]}
              activeOpacity={0.92}
              onPress={() => selectAddress(address.id)}
            >
              <View style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.title}>{address.title}</Text>
                  <Text style={styles.body}>{address.house}</Text>
                  <Text style={styles.body}>{address.street}</Text>
                  <Text style={styles.body}>{address.town} {address.pincode}</Text>
                  {address.preciseLocation ? (
                    <Text style={styles.preciseLocation}>Precise location: {address.preciseLocation}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AddressForm', { addressId: address.id })}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </React.Fragment>
        ))}
        <CustomButton title="Add New Address" onPress={() => navigation.navigate('AddressForm')} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    // backgroundColor: 'red',
    // borderWidth: 1,
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  selectedCard: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  title: { color: colors.text, fontWeight: '800', marginBottom: 6 },
  body: { color: colors.textMuted, lineHeight: 20 },
  preciseLocation: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  editText: { color: colors.primary, fontWeight: '700' },
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  emptyBody: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});

export default AddressesScreen;
