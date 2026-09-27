import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { theme } from '@/lib/theme';
import {
  DEFAULT_MODEL_VERSION,
  getModelVersion,
  getReplicateToken,
  setModelVersion,
  setReplicateToken,
} from '@/lib/restore';
import {
  clearSubscription,
  restorePurchases,
  useSubscription,
} from '@/lib/subscriptions';
import { clearRecents, resetOnboarding } from '@/lib/recents';

export default function Settings() {
  const sub = useSubscription();
  const [token, setToken] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setToken((await getReplicateToken()) ?? '');
        const v = await getModelVersion();
        setModel(v === DEFAULT_MODEL_VERSION ? '' : v);
      })();
    }, []),
  );

  const saveKeys = async () => {
    setSaving(true);
    try {
      await setReplicateToken(token);
      await setModelVersion(model || DEFAULT_MODEL_VERSION);
      Alert.alert(
        'Saved',
        token.trim() && model.trim()
          ? 'AI restoration is now live. Restore a photo to try it.'
          : 'Keys cleared — the app will run in demo mode.',
      );
    } finally {
      setSaving(false);
    }
  };

  const onRestorePurchases = async () => {
    const ok = await restorePurchases();
    Alert.alert(
      'Restore purchases',
      ok ? 'Your Pro access has been restored.' : 'No previous purchases found.',
    );
  };

  const onResetDemo = () => {
    Alert.alert(
      'Reset demo data?',
      'This clears your Pro status, recent restorations, and onboarding — useful for testing the first-run flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearSubscription();
            await clearRecents();
            await resetOnboarding();
            Alert.alert('Done', 'Demo data cleared. Restart the app to see onboarding again.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.section}>Subscription</Text>
      <View style={styles.card}>
        <Text style={styles.rowTitle}>
          {sub.pro ? `Restore Pro (${sub.tier})` : 'Free plan'}
        </Text>
        <Text style={styles.rowSub}>
          {sub.pro
            ? 'Unlimited HD restores unlocked.'
            : '3 demo restores per day with watermark.'}
        </Text>
        {!sub.pro && (
          <Pressable style={styles.accentBtn} onPress={() => router.push('/paywall')}>
            <Text style={styles.accentBtnText}>Go Pro</Text>
          </Pressable>
        )}
        <Pressable style={styles.linkBtn} onPress={onRestorePurchases}>
          <Text style={styles.linkText}>Restore purchases</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>AI setup</Text>
      <View style={styles.card}>
        <Text style={styles.rowSub}>
          Paste your Replicate API token to enable real AI restoration.
          Without it, the app runs in demo mode.
        </Text>
        <Text style={styles.label}>Replicate API token</Text>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="r8_..."
          placeholderTextColor={theme.colors.muted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>Model version (optional)</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="Leave blank to use the default"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          Get a token at replicate.com → Account → API tokens. To use a
          different restoration model, open it on replicate.com, go to the API
          tab, and paste its version hash here.
        </Text>
        <Pressable style={styles.accentBtn} onPress={saveKeys} disabled={saving}>
          <Text style={styles.accentBtnText}>
            {saving ? 'Saving…' : 'Save AI settings'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/legal')}>
          <Text style={styles.linkText}>Terms of Service & Privacy Policy</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={onResetDemo}>
          <Text style={[styles.linkText, styles.danger]}>Reset demo data</Text>
        </Pressable>
        <Text style={styles.version}>Restore v1.0.0 (MVP)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius,
    padding: 18,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowSub: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
    marginTop: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 17,
    marginTop: 10,
  },
  accentBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  accentBtnText: {
    color: '#161210',
    fontWeight: '800',
    fontSize: 15,
  },
  linkBtn: {
    paddingVertical: 10,
    marginTop: 6,
  },
  linkText: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  danger: {
    color: theme.colors.danger,
  },
  version: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 10,
  },
});
