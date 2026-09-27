import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import BeforeAfter from '@/components/BeforeAfter';
import { theme, shadow } from '@/lib/theme';
import { useSubscription } from '@/lib/subscriptions';

export default function Result() {
  const { original, restored, demo } = useLocalSearchParams<{
    original: string;
    restored: string;
    demo?: string;
  }>();
  const isDemo = demo === '1';
  const sub = useSubscription();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    // The paywall gate: value is demonstrated first (the slider),
    // money is asked at the moment of saving. Pro users skip the gate.
    if (!sub.pro) {
      router.push('/paywall');
      return;
    }
    setSaving(true);
    try {
      const { status } = await requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Allow access to your photo library to save the restoration.',
        );
        return;
      }
      await Asset.create(restored);
      Alert.alert('Saved', 'Your restored photo is in your photo library.');
    } catch (e: unknown) {
      Alert.alert(
        'Could not save',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <BeforeAfter before={original} after={restored} />

      {isDemo && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoTitle}>Demo mode</Text>
          <Text style={styles.demoBody}>
            This preview used the original photo. Add your Replicate API key in
            Settings to run real AI restoration.
          </Text>
          <Pressable onPress={() => router.push('/settings')}>
            <Text style={styles.demoLink}>Open Settings</Text>
          </Pressable>
        </View>
      )}

      <Pressable
        style={[styles.cta, shadow]}
        onPress={save}
        disabled={saving}
      >
        <Text style={styles.ctaText}>
          {saving ? 'Saving…' : sub.pro ? 'Save in HD' : 'Save in HD — Go Pro'}
        </Text>
      </Pressable>

      <Pressable style={styles.secondary} onPress={() => router.replace('/')}>
        <Text style={styles.secondaryText}>Restore another photo</Text>
      </Pressable>

      <Text style={styles.hint}>
        Drag the handle to compare before and after.
      </Text>
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
  demoBanner: {
    backgroundColor: '#2A2118',
    borderWidth: 1,
    borderColor: theme.colors.accentDark,
    borderRadius: theme.radius,
    padding: 16,
    marginTop: 16,
  },
  demoTitle: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: 15,
  },
  demoBody: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  demoLink: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 8,
  },
  cta: {
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaText: {
    color: '#161210',
    fontSize: 17,
    fontWeight: '800',
  },
  secondary: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  secondaryText: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 16,
  },
});
