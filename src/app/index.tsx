import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { theme, shadow } from '@/lib/theme';
import { getRecents, hasSeenOnboarding, type RecentItem } from '@/lib/recents';
import { useSubscription } from '@/lib/subscriptions';

export default function Home() {
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const sub = useSubscription();

  useEffect(() => {
    (async () => {
      if (!(await hasSeenOnboarding())) {
        router.replace('/onboarding');
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getRecents().then(setRecents);
    }, []),
  );

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo access so you can pick pictures to restore.',
      );
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 1,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
        });
    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/processing',
        params: { uri: result.assets[0].uri },
      });
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Restore</Text>
          <Text style={styles.subtitle}>AI photo revival studio</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Text style={styles.settingsText}>{sub.pro ? 'PRO' : 'Settings'}</Text>
        </Pressable>
      </View>

      <View style={[styles.hero, shadow]}>
        <Text style={styles.heroTitle}>Bring old photos{'\n'}back to life</Text>
        <Text style={styles.heroSub}>
          Our AI rebuilds faces, removes scratches and damage, and sharpens
          every detail — in seconds.
        </Text>
        <Pressable
          style={[styles.cta, shadow]}
          onPress={() => pickImage(false)}
        >
          <Text style={styles.ctaText}>Restore a photo</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => pickImage(true)}>
          <Text style={styles.secondaryText}>Or take a photo</Text>
        </Pressable>
      </View>

      {recents.length > 0 && (
        <View style={styles.recentsWrap}>
          <Text style={styles.sectionTitle}>Recent restorations</Text>
          <FlatList
            data={recents}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.recentsList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/result',
                    params: {
                      original: item.original,
                      restored: item.restored,
                      demo: item.demo ? '1' : '0',
                    },
                  })
                }
              >
                <Image
                  source={{ uri: item.restored }}
                  style={styles.thumb}
                />
              </Pressable>
            )}
          />
        </View>
      )}

      {!sub.pro && (
        <Pressable
          style={styles.proBanner}
          onPress={() => router.push('/paywall')}
        >
          <Text style={styles.proBannerText}>
            Go Pro — unlimited HD restores, no watermark
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 2,
  },
  settingsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  settingsText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  hero: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 36,
  },
  heroSub: {
    fontSize: 15,
    color: theme.colors.muted,
    marginTop: 10,
    lineHeight: 22,
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
    paddingVertical: 6,
  },
  secondaryText: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  recentsWrap: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  recentsList: {
    gap: 12,
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  proBanner: {
    marginTop: 'auto',
    marginBottom: 32,
    backgroundColor: '#2A2118',
    borderWidth: 1,
    borderColor: theme.colors.accentDark,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  proBannerText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
