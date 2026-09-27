import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { theme, shadow } from '@/lib/theme';
import { markOnboardingSeen } from '@/lib/recents';

const SLIDES = [
  {
    art: '◈',
    title: 'Faded, torn, blurry?',
    body: 'Restore brings your family\u2019s old photos back to life with AI — the ones sitting in boxes and albums, fading a little more every year.',
  },
  {
    art: '✦',
    title: 'One tap is all it takes',
    body: 'Pick a photo. Our AI rebuilds faces, removes scratches and damage, and sharpens every detail in seconds.',
  },
  {
    art: '❤',
    title: 'Keep every memory',
    body: 'Save unlimited restorations in full quality and share them with the people who\u2019ll treasure them most.',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const next = async () => {
    if (last) {
      await markOnboardingSeen();
      // Paywall in the first session: 80-90% of trials start on day 0.
      router.replace('/paywall');
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.artWrap}>
        <Text style={styles.art}>{slide.art}</Text>
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <Pressable style={[styles.cta, shadow]} onPress={next}>
        <Text style={styles.ctaText}>{last ? 'Get started' : 'Next'}</Text>
      </Pressable>

      {!last && (
        <Pressable
          style={styles.skip}
          onPress={async () => {
            await markOnboardingSeen();
            router.replace('/paywall');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 32,
    paddingTop: 120,
    alignItems: 'center',
  },
  artWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  art: {
    fontSize: 48,
    color: theme.colors.accent,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.cardBorder,
  },
  dotActive: {
    backgroundColor: theme.colors.accent,
    width: 24,
  },
  cta: {
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 64,
    marginTop: 48,
  },
  ctaText: {
    color: '#161210',
    fontSize: 17,
    fontWeight: '800',
  },
  skip: {
    marginTop: 18,
    padding: 8,
  },
  skipText: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});
