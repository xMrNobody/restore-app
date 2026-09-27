import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { theme, shadow } from '@/lib/theme';
import {
  TIERS,
  purchase,
  redeemUnlockCode,
  restorePurchases,
  type Tier,
} from '@/lib/subscriptions';

export default function Paywall() {
  const [buying, setBuying] = useState<Tier | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const buy = async (tier: Tier) => {
    setBuying(tier);
    try {
      await purchase(tier);
      close();
    } catch (e: unknown) {
      Alert.alert(
        'Purchase failed',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setBuying(null);
    }
  };

  const onRestore = async () => {
    const ok = await restorePurchases();
    Alert.alert(
      'Restore purchases',
      ok ? 'Your Pro access has been restored.' : 'No previous purchases found.',
    );
    if (ok) close();
  };

  const onRedeem = async () => {
    if (!code.trim()) return;
    setRedeeming(true);
    try {
      const ok = await redeemUnlockCode(code);
      if (ok) {
        Alert.alert('Pro unlocked', 'Your unlock code worked. Enjoy Restore Pro!');
        close();
      } else {
        Alert.alert('Invalid code', 'That code did not work. Check it and try again.');
      }
    } finally {
      setRedeeming(false);
      setCode('');
    }
  };

  return (
    <View style={styles.root}>
      <Pressable style={styles.close} onPress={close}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>RESTORE PRO</Text>
        <Text style={styles.title}>Every memory,{'\n'}in full quality</Text>
        <Text style={styles.sub}>
          Unlimited AI restorations, full-resolution downloads, no watermark.
        </Text>

        <View style={styles.features}>
          {[
            'Unlimited photo restorations',
            'Full HD downloads, no watermark',
            'Priority AI processing',
            'New AI models first',
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.feature}>{f}</Text>
            </View>
          ))}
        </View>

        {TIERS.map((tier) => (
          <Pressable
            key={tier.id}
            style={[
              styles.tier,
              tier.badge && styles.tierHighlight,
              shadow,
            ]}
            onPress={() => buy(tier.id)}
            disabled={buying !== null}
          >
            {tier.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tier.badge}</Text>
              </View>
            )}
            <View style={styles.tierRow}>
              <View style={styles.tierInfo}>
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.tierPrice}>{tier.price}</Text>
                <Text style={styles.tierBlurb}>{tier.blurb}</Text>
              </View>
              {buying === tier.id ? (
                <ActivityIndicator color={theme.colors.accent} />
              ) : (
                <View style={styles.radio} />
              )}
            </View>
          </Pressable>
        ))}

        <Pressable style={styles.restoreBtn} onPress={onRestore}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        <Pressable
          style={styles.restoreBtn}
          onPress={() => setCodeOpen((v) => !v)}
        >
          <Text style={styles.restoreText}>Have an unlock code?</Text>
        </Pressable>

        {codeOpen && (
          <View style={styles.codeRow}>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              placeholder="XXXX-XXXX-XXXX"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!redeeming}
              onSubmitEditing={onRedeem}
            />
            <Pressable
              style={[styles.codeBtn, shadow]}
              onPress={onRedeem}
              disabled={redeeming || !code.trim()}
            >
              {redeeming ? (
                <ActivityIndicator color="#161210" />
              ) : (
                <Text style={styles.codeBtnText}>Redeem</Text>
              )}
            </Pressable>
          </View>
        )}

        <Text style={styles.fineprint}>
          Payment is charged to your App Store or Google Play account at
          confirmation. Subscriptions renew automatically unless cancelled at
          least 24 hours before the end of the current period. You can manage
          or cancel anytime in your store account settings.
        </Text>

        <View style={styles.legalRow}>
          <Pressable onPress={() => router.push('/legal')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.legalSep}> · </Text>
          <Pressable onPress={() => router.push('/legal')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  close: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.muted,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 40,
  },
  kicker: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 38,
    marginTop: 8,
  },
  sub: {
    fontSize: 15,
    color: theme.colors.muted,
    marginTop: 10,
    lineHeight: 22,
  },
  features: {
    marginTop: 24,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    color: theme.colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  feature: {
    color: theme.colors.text,
    fontSize: 15,
  },
  tier: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius,
    padding: 18,
    marginTop: 14,
  },
  tierHighlight: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#161210',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierInfo: {
    flex: 1,
  },
  tierTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  tierPrice: {
    color: theme.colors.accent,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  tierBlurb: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  restoreBtn: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  restoreText: {
    color: theme.colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
    letterSpacing: 1,
  },
  codeBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  codeBtnText: {
    color: '#161210',
    fontWeight: '800',
    fontSize: 15,
  },
  fineprint: {
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legalLink: {
    color: theme.colors.muted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  legalSep: {
    color: theme.colors.muted,
  },
});
