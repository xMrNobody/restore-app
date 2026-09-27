import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';

export interface RestoreResult {
  /** Local file URI of the restored image */
  uri: string;
  /** True when no API key is configured and the demo flow was used */
  demo: boolean;
}

/**
 * Default Replicate model used for restoration.
 *
 * microsoft/bringing-old-photos-back-to-life — purpose-built for old photo
 * restoration (scratches, fading) with face enhancement. Version below was
 * verified working on 2026-09-26. Input: { image, HR?, with_scratch? }.
 * To switch models, open the model on https://replicate.com/explore ->
 * "API" tab -> copy the version hash.
 */
export const DEFAULT_MODEL_VERSION =
  'c75db81db6cbd809d93cc3b7e7a088a351a3349c9fa02b6d393e35e0d51ba799';

const TOKEN_KEY = 'replicate_token';
const MODEL_KEY = 'replicate_model';

/**
 * Token resolution order:
 * 1. EXPO_PUBLIC_REPLICATE_TOKEN env var (baked into sprint APK builds, so
 *    shared installs work without each user entering a token).
 * 2. SecureStore (entered in Settings on-device).
 */
export async function getReplicateToken(): Promise<string | null> {
  const baked = process.env.EXPO_PUBLIC_REPLICATE_TOKEN;
  if (baked && baked.trim()) return baked.trim();
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setReplicateToken(token: string): Promise<void> {
  if (token.trim()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token.trim());
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export async function getModelVersion(): Promise<string> {
  const saved = await SecureStore.getItemAsync(MODEL_KEY);
  return saved ?? DEFAULT_MODEL_VERSION;
}

export async function setModelVersion(version: string): Promise<void> {
  await SecureStore.setItemAsync(MODEL_KEY, version.trim());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Staged messages shown while the (demo or real) restore runs. */
export const RESTORE_STEPS = [
  'Scanning your photo…',
  'Rebuilding faces…',
  'Removing scratches and damage…',
  'Sharpening details…',
  'Adding the finishing touches…',
];

async function demoRestore(): Promise<void> {
  // Demo mode: no real AI call. The staged progress above already
  // simulated the pipeline, so the whole app stays testable end-to-end
  // without an API key. The original photo is returned as the "result".
}

interface Prediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

async function createPrediction(
  token: string,
  modelVersion: string,
  imageDataUri: string,
): Promise<Prediction> {
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      version: modelVersion,
      input: { image: imageDataUri },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate rejected the request (${res.status}): ${text.slice(0, 160)}`);
  }
  return (await res.json()) as Prediction;
}

async function waitForPrediction(token: string, id: string): Promise<Prediction> {
  const started = Date.now();
  while (Date.now() - started < 180_000) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) throw new Error(`Could not check restore status (${res.status})`);
    const p = (await res.json()) as Prediction;
    if (p.status === 'succeeded' || p.status === 'failed' || p.status === 'canceled') {
      return p;
    }
    await sleep(2500);
  }
  throw new Error('The restore took too long. Please try again.');
}

/**
 * Restore a photo. Uses the Replicate API when a token + model version are
 * configured in Settings; otherwise runs in demo mode.
 *
 * `onStep` receives 0..1 progress for the UI.
 */
export async function restorePhoto(
  sourceUri: string,
  onStep?: (progress: number, label: string) => void,
): Promise<RestoreResult> {
  const [token, modelVersion] = await Promise.all([getReplicateToken(), getModelVersion()]);
  const configured = !!token && !!modelVersion && modelVersion !== DEFAULT_MODEL_VERSION;

  if (!configured) {
    for (let i = 0; i < RESTORE_STEPS.length; i++) {
      onStep?.(i / RESTORE_STEPS.length, RESTORE_STEPS[i]);
      await sleep(900);
    }
    onStep?.(1, 'Done');
    await demoRestore();
    return { uri: sourceUri, demo: true };
  }

  onStep?.(0.05, 'Uploading your photo…');
  // Replicate accepts data URIs, so we send the image inline (no server needed).
  const base64 = await LegacyFS.readAsStringAsync(sourceUri, {
    encoding: LegacyFS.EncodingType.Base64,
  });
  const ext = sourceUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const dataUri = `data:${mime};base64,${base64}`;

  onStep?.(0.2, 'Sending to the AI…');
  let prediction = await createPrediction(token!, modelVersion, dataUri);

  if (prediction.status !== 'succeeded') {
    onStep?.(0.4, 'AI is restoring your photo…');
    prediction = await waitForPrediction(token!, prediction.id);
  }

  if (prediction.status !== 'succeeded' || !prediction.output) {
    throw new Error(prediction.error ?? 'The AI could not restore this photo.');
  }

  onStep?.(0.9, 'Saving the result…');
  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  const dest = new File(Paths.cache, `restored-${Date.now()}.jpg`);
  const downloaded = await File.downloadFileAsync(outputUrl, dest);
  onStep?.(1, 'Done');
  return { uri: downloaded.uri, demo: false };
}
