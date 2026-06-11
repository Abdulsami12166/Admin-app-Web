import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
const AddressFormScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { savedAddresses, saveAddress } = useAppStore();
  const editingAddress = useMemo(
    () => savedAddresses.find(item => item.id === route.params?.addressId) || null,
    [route.params?.addressId, savedAddresses],
  );
  const [form, setForm] = useState(() => ({
    title: editingAddress?.title || '',
    house: editingAddress?.house || '',
    street: editingAddress?.street || '',
    town: editingAddress?.town || '',
    pincode: editingAddress?.pincode || '',
    preciseLocation: editingAddress?.preciseLocation || '',
    selected: editingAddress?.selected || false,
  }));

  const handleSave = () => {
    if (!form.title.trim() || !form.house.trim() || !form.street.trim() || !form.town.trim() || !form.pincode.trim()) {
      Alert.alert(
        'Complete address',
        'Please fill address label, house, street, town, and pincode before saving.',
      );
      return;
    }

    saveAddress({
      id: editingAddress?.id,
      title: form.title.trim(),
      house: form.house.trim(),
      street: form.street.trim(),
      town: form.town.trim(),
      pincode: form.pincode.trim(),
      preciseLocation: form.preciseLocation.trim(),
      selected: form.selected,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={editingAddress ? 'Edit Address' : 'Add Address'}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.card}>
          <CustomInput
            label="Address Label"
            placeholder="Home, Office, Studio"
            value={form.title}
            onChangeText={value => setForm(current => ({ ...current, title: value }))}
          />
          <CustomInput
            label="Home / Flat / House"
            placeholder="Flat no, house no, building"
            value={form.house}
            onChangeText={value => setForm(current => ({ ...current, house: value }))}
          />

          <CustomInput
            label="Street"
            placeholder="Street, road, area"
            value={form.street}
            onChangeText={value => setForm(current => ({ ...current, street: value }))}
          />

          <CustomInput
            label="Town / City"
            placeholder="Town or city"
            value={form.town}
            onChangeText={value => setForm(current => ({ ...current, town: value }))}
          />

          <CustomInput
            label="Pincode"
            placeholder="Enter pincode"
            keyboardType="number-pad"
            value={form.pincode}
            onChangeText={value => setForm(current => ({ ...current, pincode: value }))}
          />

          <CustomInput
            label="Add Precise Location"
            placeholder="Landmark, map pin, gate note"
            value={form.preciseLocation}
            onChangeText={value => setForm(current => ({ ...current, preciseLocation: value }))}
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Set As Default</Text>
              <Text style={styles.toggleSubtitle}>Use this as the main delivery address</Text>
            </View>
            <Switch
              value={form.selected}
              onValueChange={value => setForm(current => ({ ...current, selected: value }))}
              trackColor={{ false: '#D8CCC1', true: '#C8B19B' }}
              thumbColor={form.selected ? colors.primary : colors.surface}
            />
          </View>

          <CustomButton
            title={editingAddress ? 'Update Address' : 'Save Address'}
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  toggleSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    lineHeight: 20,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

export default AddressFormScreen;
