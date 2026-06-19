import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './data';

const CACHE_KEY = 'koetutka:whatsnew:v1';

export interface WelcomeNote {
  title: string;
  body: string;
}

export interface ReleaseNote {
  version: string;
  date?: string;
  title: string;
  items: string[];
}

export interface WhatsNewData {
  welcome?: WelcomeNote;
  releases?: ReleaseNote[];
}

export type WhatsNewContent =
  | { kind: 'welcome'; title: string; body: string }
  | { kind: 'release'; version: string; date?: string; title: string; items: string[] };

/** Sovellukseen koodattu varateksti offline-ensiasennusta varten. */
export const FALLBACK_WELCOME: WelcomeNote = {
  title: 'Tervetuloa Koetutkaan',
  body:
    'Koetutka näyttää noutajien metsästyskokeet kartalla ja listana, lähimmät ensin. ' +
    'Valitse sijaintisi, selaa tulevia kokeita, tallenna suosikkeja ja vie ne kalenteriin.',
};

function welcomeContent(note: WelcomeNote): WhatsNewContent {
  return { kind: 'welcome', title: note.title, body: note.body };
}

function releaseContent(r: ReleaseNote): WhatsNewContent {
  return { kind: 'release', version: r.version, date: r.date, title: r.title, items: r.items };
}

/**
 * Päättää näytetäänkö "Mitä uutta" automaattisesti.
 * - lastSeen null → welcome (remote tai varateksti).
 * - lastSeen === current → null (jo nähty).
 * - muuten → asennetun version release jos remotessa, muuten null.
 */
export function resolveWhatsNew(params: {
  current: string;
  lastSeen: string | null;
  data: WhatsNewData | null;
}): WhatsNewContent | null {
  const { current, lastSeen, data } = params;
  if (lastSeen == null) {
    return welcomeContent(data?.welcome ?? FALLBACK_WELCOME);
  }
  if (lastSeen === current) return null;
  const release = data?.releases?.find((r) => r.version === current);
  return release ? releaseContent(release) : null;
}

/** Manuaaliseen avaukseen (Asetukset): aina jotain näytettävää. */
export function pickManualContent(current: string, data: WhatsNewData | null): WhatsNewContent {
  const release =
    data?.releases?.find((r) => r.version === current) ?? data?.releases?.[0];
  if (release) return releaseContent(release);
  return welcomeContent(data?.welcome ?? FALLBACK_WELCOME);
}

/** Muotoilee ISO-päivän (esim. "2026-06-18") suomalaiseksi "18.06.2026". */
export function formatWhatsNewDate(iso?: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return '';
  const [, year, month, day] = m;
  return `${day}.${month}.${year}`;
}

/** Lukee vain välimuistin (ei verkkoa) — nopeaan ensimmäiseen renderöintiin. */
export async function getCachedWhatsNew(): Promise<WhatsNewData | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    return cached ? (JSON.parse(cached) as WhatsNewData) : null;
  } catch {
    return null;
  }
}

/** Hakee whatsnew.json:n; välimuistittaa onnistuneen haun ja fallbackaa siihen. */
export async function fetchWhatsNew(): Promise<WhatsNewData | null> {
  try {
    const res = await fetch(`${BASE_URL}/whatsnew.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as WhatsNewData;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  } catch {
    return getCachedWhatsNew();
  }
}
