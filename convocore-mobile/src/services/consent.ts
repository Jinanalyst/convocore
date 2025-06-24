import * as SecureStore from "expo-secure-store";

export type DataType = "contacts" | "calendar" | "location";
export type ConsentPrefs = Record<DataType, boolean>;

const STORAGE_KEY = "convocore_consent_prefs";

// Default: no consent granted
const defaultPrefs: ConsentPrefs = {
  contacts: false,
  calendar: false,
  location: false,
};

export async function loadConsent(): Promise<ConsentPrefs> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as ConsentPrefs;
  } catch {}
  return { ...defaultPrefs };
}

export async function saveConsent(prefs: ConsentPrefs): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(prefs));
}

export async function getConsent(type: DataType): Promise<boolean> {
  const prefs = await loadConsent();
  return prefs[type] || false;
}

export async function setConsent(type: DataType, value: boolean): Promise<void> {
  const prefs = await loadConsent();
  prefs[type] = value;
  await saveConsent(prefs);
} 