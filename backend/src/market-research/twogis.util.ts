export interface TwoGisResult {
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  lat: number | null;
  lon: number | null;
}

interface TwoGisContact {
  type?: string;
  value?: string;
}

interface TwoGisItem {
  name?: string;
  address_name?: string;
  point?: { lat?: number; lon?: number };
  contact_groups?: Array<{ contacts?: TwoGisContact[] }>;
  reviews?: { rating?: number };
}

// Approximate region-center coordinates (lon, lat) for 2GIS geographic search bias.
// 2GIS has no free-text city filter — it requires city_id or a point+radius.
const CITY_COORDS: Record<string, { lon: number; lat: number }> = {
  toshkent: { lon: 69.2401, lat: 41.2995 },
  samarqand: { lon: 66.9597, lat: 39.627 },
  buxoro: { lon: 64.4207, lat: 39.7747 },
  urganch: { lon: 60.6333, lat: 41.55 },
  xiva: { lon: 60.3639, lat: 41.3783 },
  andijon: { lon: 72.3442, lat: 40.7821 },
  namangan: { lon: 71.6726, lat: 40.9983 },
  "farg'ona": { lon: 71.7864, lat: 40.3894 },
  fargona: { lon: 71.7864, lat: 40.3894 },
  nukus: { lon: 59.6103, lat: 42.4531 },
  qarshi: { lon: 65.7887, lat: 38.8606 },
  termiz: { lon: 67.2783, lat: 37.2242 },
  jizzax: { lon: 67.8422, lat: 40.1158 },
  guliston: { lon: 68.7842, lat: 40.4897 },
  navoiy: { lon: 65.3792, lat: 40.1039 },
};

function resolveCityPoint(city: string): { lon: number; lat: number } {
  const key = city.trim().toLowerCase();
  return CITY_COORDS[key] ?? CITY_COORDS.toshkent;
}

export async function searchTwoGis(
  query: string,
  city: string,
  apiKey: string,
  limit = 8,
): Promise<TwoGisResult[]> {
  if (!apiKey) return [];
  try {
    const point = resolveCityPoint(city);
    const url = new URL('https://catalog.api.2gis.com/3.0/items');
    url.searchParams.set('q', query);
    url.searchParams.set('point', `${point.lon},${point.lat}`);
    url.searchParams.set('radius', '20000');
    url.searchParams.set('page_size', String(limit));
    url.searchParams.set(
      'fields',
      'items.contact_groups,items.reviews,items.point',
    );
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      result?: { items?: TwoGisItem[] };
    };
    const items = data.result?.items ?? [];

    return items
      .filter((item) => item.name)
      .slice(0, limit)
      .map((item) => {
        const phone = item.contact_groups
          ?.flatMap((group) => group.contacts ?? [])
          .find((contact) => contact.type === 'phone')?.value;
        return {
          name: item.name as string,
          address: item.address_name ?? null,
          phone: phone ?? null,
          rating: item.reviews?.rating ?? null,
          lat: item.point?.lat ?? null,
          lon: item.point?.lon ?? null,
        };
      });
  } catch {
    return [];
  }
}
