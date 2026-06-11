import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {Screen} from '../../../components/Screen';
import {useAdminAuth} from '../../../store/authStore';
import {palette} from '../../../theme/palette';

export const AdminLoginScreen = () => {
  const {login} = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter the admin email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Admin login failed', error?.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      title="Admin Control Room"
      subtitle="Standalone operations app for realtime activity, order updates, and catalog supervision."
      scroll={false}>
      <View style={styles.card}>
        <Text style={styles.label}>Admin email</Text>
        <TextInput
          autoCapitalize="none"
          placeholder="admin@example.com"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          placeholder="Enter password"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
  },
  label: {
    color: palette.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: palette.background,
    fontWeight: '800',
    fontSize: 16,
  },
});
