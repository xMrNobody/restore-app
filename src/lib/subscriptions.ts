import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { validateUnlockCode } from './unlockCodes';

export type Tier = 'weekly' | 'annual' | 'lifetime';

export interface TierInfo {
  id: Tier;
  title: string;
  price: string;
  blurb: string;
  badge?: string;
}

export const TIERS: TierInfo[] = [
  {
    id: 'weekly',
    title: 'Weekly',
    price: '$6.99/week',
    blurb: '3-day free trial, then $6.99/week. Cancel anytime.',
  },
  {
    id: 'annual',
    title: 'Annual',
    price: '$39.99/year',
    blurb: 'Just $0.77/week. Our best value.',
    badge: 'MOST POPULAR',
  },
  {
    id: 'lifetime',
    title: 'Lifetime',
    price: '$99 once',
    blurb: 'Pay once, restore forever.',
  },
];

/**
 * RevenueCat configuration.
 *
 * 1. Create these products in Google Play Console (Monetize → Products →
 *    Subscriptions / One-time products) with EXACTLY these product IDs.
 * 2. In RevenueCat (app.revenuecat.com): add your Play app, create an
 *    Entitlement called "pro", attach the products, and create an Offering
 *    containing all three packages.
 * 3. Put your RevenueCat *public* SDK key in the EXPO_PUBLIC_REVENUECAT_KEY
 *    env var (EAS secret for production builds, see eas.json).
 */
export const ENTITLEMENT_ID = 'pro';

const PRODUCT_IDS: Record<Tier, string> = {
  weekly: 'restore_weekly_699',
  annual: 'restore_annual_3999',
  lifetime: 'restore_lifetime_9900',
};

const RC_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? 'REPLACE_WITH_REVENUECAT_KEY';

interface SubState {
  pro: boolean;
  tier: Tier | null;
  ready: boolean;
}

const PRO_KEY = 'restore_pro_tier';

let state: SubState = { pro: false, tier: null, ready: false };
/** True once the real RevenueCat SDK is live (false in Expo Go / no key). */
let rcLive = false;
const listeners = new Set<() => void>();

function setState(next: SubState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SubState {
  return state;
}

export function useSubscription() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

function tierFromProductId(productId: string): Tier | null {
  const entry = (Object.entries(PRODUCT_IDS) as [Tier, string][]).find(
    ([, id]) => id === productId,
  );
  return entry ? entry[0] : null;
}

function syncFromCustomerInfo(info: CustomerInfo) {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (entitlement) {
    setState({
      pro: true,
      tier: tierFromProductId(entitlement.productIdentifier) ?? 'annual',
      ready: true,
    });
  } else {
    setState({ pro: false, tier: null, ready: true });
  }
}

/** Local mock used when RevenueCat isn't available (Expo Go, no API key). */
async function initMock() {
  const tier = await SecureStore.getItemAsync(PRO_KEY);
  setState({ pro: !!tier, tier: (tier as Tier) ?? null, ready: true });
}

/**
 * Initialise billing. Tries the real RevenueCat SDK first; falls back to
 * the local mock when running in Expo Go or without an API key, so the full
 * paywall flow stays testable everywhere.
 */
export async function initSubscriptions(): Promise<void> {
  const keyConfigured =
    RC_KEY !== 'REPLACE_WITH_REVENUECAT_KEY' && RC_KEY.length > 0;
  if (keyConfigured && Platform.OS !== 'web') {
    try {
      Purchases.configure({ apiKey: RC_KEY });
      Purchases.addCustomerInfoUpdateListener(syncFromCustomerInfo);
      const info = await Purchases.getCustomerInfo();
      rcLive = true;
      syncFromCustomerInfo(info);
      return;
    } catch (e) {
      console.warn('RevenueCat unavailable, using local mock:', e);
    }
  }
  rcLive = false;
  await initMock();
}

/** Find the RevenueCat package matching a tier. */
async function packageForTier(tier: Tier): Promise<PurchasesPackage> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find(
    (p) => p.product.identifier === PRODUCT_IDS[tier],
  );
  if (!pkg) {
    throw new Error(
      `Product "${PRODUCT_IDS[tier]}" is not in your current RevenueCat offering. Check the RevenueCat dashboard.`,
    );
  }
  return pkg;
}

function isUserCancelled(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    (e as { userCancelled?: boolean }).userCancelled === true
  );
}

/**
 * Purchase a tier. In production this opens the Google Play billing sheet.
 * Cancellation is silent (no error alert); other failures throw.
 */
export async function purchase(tier: Tier): Promise<void> {
  if (!rcLive) {
    // Mock purchase for Expo Go / pre-launch testing.
    await new Promise((r) => setTimeout(r, 1200));
    await SecureStore.setItemAsync(PRO_KEY, tier);
    setState({ pro: true, tier, ready: true });
    return;
  }
  try {
    const pkg = await packageForTier(tier);
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    syncFromCustomerInfo(customerInfo);
  } catch (e) {
    if (isUserCancelled(e)) return;
    throw e instanceof Error ? e : new Error('Purchase failed.');
  }
}

/** Re-check entitlements with the store. Returns true if Pro is active. */
export async function restorePurchases(): Promise<boolean> {
  if (!rcLive) {
    const tier = await SecureStore.getItemAsync(PRO_KEY);
    const pro = !!tier;
    setState({ pro, tier: (tier as Tier) ?? null, ready: true });
    return pro;
  }
  const info = await Purchases.restorePurchases();
  syncFromCustomerInfo(info);
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

/** Clear local entitlement (used in Settings for testing). */
export async function clearSubscription(): Promise<void> {
  await SecureStore.deleteItemAsync(PRO_KEY);
  setState({ pro: false, tier: null, ready: true });
}

/**
 * Redeem a sprint unlock code (free-APK validation only). Returns true when
 * the code is valid; grants lifetime Pro locally. Not used once real store
 * billing is live.
 */
export async function redeemUnlockCode(code: string): Promise<boolean> {
  const ok = await validateUnlockCode(code);
  if (!ok) return false;
  await SecureStore.setItemAsync(PRO_KEY, 'lifetime');
  setState({ pro: true, tier: 'lifetime', ready: true });
  return true;
}
