import * as SecureStore from 'expo-secure-store';

export interface RecentItem {
  id: string;
  original: string;
  restored: string;
  date: number;
  demo: boolean;
}

const RECENTS_KEY = 'restore_recents';
const MAX_RECENTS = 20;

export async function getRecents(): Promise<RecentItem[]> {
  try {
    const raw = await SecureStore.getItemAsync(RECENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentItem[];
  } catch {
    return [];
  }
}

export async function addRecent(item: Omit<RecentItem, 'id' | 'date'>): Promise<void> {
  const recents = await getRecents();
  const entry: RecentItem = {
    ...item,
    id: `${Date.now()}`,
    date: Date.now(),
  };
  const next = [entry, ...recents].slice(0, MAX_RECENTS);
  await SecureStore.setItemAsync(RECENTS_KEY, JSON.stringify(next));
}

export async function clearRecents(): Promise<void> {
  await SecureStore.deleteItemAsync(RECENTS_KEY);
}

const SEEN_KEY = 'restore_onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await SecureStore.getItemAsync(SEEN_KEY)) === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(SEEN_KEY, '1');
}

export async function resetOnboarding(): Promise<void> {
  await SecureStore.deleteItemAsync(SEEN_KEY);
}
