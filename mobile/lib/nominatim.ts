export interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchLocation(query: string): Promise<LocationResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    trimmed,
  )}&format=json&countrycodes=fi&limit=5`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Koetutka-Mobile/0.1 (https://github.com/trotor/koetutka)' },
    });
    if (!response.ok) return [];
    const items: NominatimItem[] = await response.json();
    return items.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
