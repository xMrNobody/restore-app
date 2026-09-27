import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '@/lib/theme';
import { restorePhoto } from '@/lib/restore';
import { addRecent } from '@/lib/recents';

export default function Processing() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('Starting…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await restorePhoto(uri, (p, l) => {
          if (!cancelled) {
            setProgress(p);
            setLabel(l);
          }
        });
        if (cancelled) return;
        await addRecent({
          original: uri,
          restored: result.uri,
          demo: result.demo,
        });
        router.replace({
          pathname: '/result',
          params: {
            original: uri,
            restored: result.uri,
            demo: result.demo ? '1' : '0',
          },
        });
      } catch (e: unknown) {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : 'Something went wrong.';
        Alert.alert('Restore failed', message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return (
    <View style={styles.root}>
      <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
      <ActivityIndicator
        size="large"
        color={theme.colors.accent}
        style={styles.spinner}
      />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barTrack}>
        <View
          style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]}
        />
      </View>
      <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
      <Pressable style={styles.cancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  preview: {
    width: 180,
    height: 180,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    opacity: 0.85,
  },
  spinner: {
    marginTop: 36,
  },
  label: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.card,
    marginTop: 16,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 4,
  },
  pct: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.muted,
  },
  cancel: {
    marginTop: 32,
    padding: 10,
  },
  cancelText: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});
