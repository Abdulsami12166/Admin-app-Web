import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency, getCartTotal } from '../../utils/helpers';

const CheckoutScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { cartItems, savedAddresses, selectAddress } = useAppStore();
  const subtotal = getCartTotal(cartItems);
  const shipping = 12;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Checkout"
          onBack={() => navigation.goBack()}
          rightLabel="Change"
          onRightPress={() => navigation.navigate('Addresses')}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {!savedAddresses.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.cardTitle}>Add delivery address</Text>
              <Text style={styles.cardBody}>
                Add home, street, town, pincode, and precise location before payment.
              </Text>
            </View>
          ) : null}
          {savedAddresses.map(address => (
            <Pressable
              key={address.id}
              onPress={() => selectAddress(address.id)}
              style={[styles.card, address.selected && styles.selectedCard]}
            >
              <Text style={styles.cardTitle}>{address.title}</Text>
              <Text style={styles.cardBody}>{address.house}</Text>
              <Text style={styles.cardBody}>{address.street}</Text>
              <Text style={styles.cardBody}>{address.town} {address.pincode}</Text>
              {address.preciseLocation ? (
                <Text style={styles.preciseLocation}>Precise location: {address.preciseLocation}</Text>
              ) : null}
            </Pressable>
          ))}
          <CustomButton
            title="Add Delivery Address"
            variant="secondary"
            onPress={() => navigation.navigate('AddressForm')}
            style={styles.addressButton}
          />
          <CustomButton
            title="Manage Delivery Addresses"
            variant="secondary"
            onPress={() => navigation.navigate('Addresses')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {!cartItems.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.cardTitle}>Your cart is empty</Text>
              <Text style={styles.cardBody}>Only products added by the user will appear here.</Text>
            </View>
          ) : null}
          {cartItems.map(item => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryText}>{item.name}</Text>
              <Text style={styles.summaryText}>{formatCurrency(item.price)}</Text>
            </View>
          ))}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryMuted}>Shipping</Text>
            <Text style={styles.summaryMuted}>{formatCurrency(shipping)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal + shipping)}</Text>
          </View>
        </View>

        <CustomButton title="Continue to Payment" onPress={() => navigation.navigate('Payment')} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.md },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  selectedCard: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  cardTitle: { color: colors.text, fontWeight: '700', marginBottom: 6 },
  cardBody: { color: colors.textMuted, lineHeight: 20 },
  preciseLocation: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  addressButton: {
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryText: { color: colors.text, fontWeight: '600', maxWidth: '70%' },
  summaryMuted: { color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { color: colors.text, fontWeight: '800' },
  totalValue: { color: colors.primary, fontWeight: '800', fontSize: 18 },
});

export default CheckoutScreen;
