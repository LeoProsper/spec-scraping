/**
 * Google Maps Scraper Service
 * Integration with google-maps-scraper API
 */

import type {
  GoogleMapsPlace,
  ScraperResponse,
  SearchParams,
} from '../types';

const SCRAPER_URL = process.env.GOOGLE_MAPS_SCRAPER_URL || 'http://localhost:3040';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_SCRAPER === 'true';

export class GoogleMapsScraperError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'GoogleMapsScraperError';
  }
}

/**
 * Generate mock data for development
 */
function generateMockPlaces(query: string, count: number): GoogleMapsPlace[] {
  const [businessType, location] = query.split(/\s+em\s+/i);
  const mockPlaces: GoogleMapsPlace[] = [];

  for (let i = 0; i < count; i++) {
    mockPlaces.push({
      name: `${businessType || 'Empresa'} ${location || 'Local'} ${i + 1}`,
      place_id: `mock_place_${Date.now()}_${i}`,
      coordinates: {
        latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
        longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
      },
      address: `Rua Exemplo ${i + 1}, ${location || 'São Paulo'} - SP`,
      rating: Math.random() > 0.3 ? parseFloat((3 + Math.random() * 2).toFixed(1)) : undefined,
      reviews_count: Math.random() > 0.3 ? Math.floor(Math.random() * 500) : undefined,
      categories: [businessType || 'Negócio Local'],
      website: Math.random() > 0.4 ? `https://example${i}.com` : undefined,
      phone: Math.random() > 0.3 ? `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}` : undefined,
      link: `https://maps.google.com/?cid=${Date.now()}${i}`,
    });
  }

  return mockPlaces;
}

/**
 * Fetch places from Google Maps using the scraper API
 */
export async function searchPlaces(
  params: SearchParams,
): Promise<ScraperResponse> {
  // Use mock data for development if enabled
  if (USE_MOCK) {
    console.log('[GoogleMapsScraperService] Using mock data');
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
    const places = generateMockPlaces(params.query, Math.min(params.maxPlaces, 20));
    return { places, total: places.length };
  }

  try {
    const url = new URL(`${SCRAPER_URL}/scrape-get`);
    url.searchParams.set('query', params.query);
    url.searchParams.set('max_places', params.maxPlaces.toString());
    url.searchParams.set('lang', params.lang);
    url.searchParams.set('headless', 'true');

    if (params.radius) {
      url.searchParams.set('radius', params.radius.toString());
    }

    console.log('[GoogleMapsScraperService] Fetching places:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout after 60 seconds
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new GoogleMapsScraperError(
        `Scraper API error: ${response.statusText}`,
        response.status,
        errorText,
      );
    }

    const data = await response.json();

    // Validate response format
    if (!Array.isArray(data)) {
      throw new GoogleMapsScraperError(
        'Invalid response format: expected array of places',
      );
    }

    const places: GoogleMapsPlace[] = data.map((place: any) => ({
      name: place.name || 'Unknown',
      place_id: place.place_id || place.id || `place_${Date.now()}`,
      coordinates: {
        latitude: place.coordinates?.latitude || place.lat || 0,
        longitude: place.coordinates?.longitude || place.lng || 0,
      },
      address: place.address || place.formatted_address || '',
      rating: place.rating ? parseFloat(place.rating) : undefined,
      reviews_count: place.reviews_count || place.user_ratings_total
        ? parseInt(place.reviews_count || place.user_ratings_total, 10)
        : undefined,
      categories: Array.isArray(place.categories) ? place.categories : 
                  Array.isArray(place.types) ? place.types : [],
      website: place.website || place.url || undefined,
      phone: place.phone || place.formatted_phone_number || undefined,
      link: place.link || place.url || '',
    }));

    console.log(
      `[GoogleMapsScraperService] Found ${places.length} places`,
    );

    return {
      places,
      total: places.length,
    };
  } catch (error) {
    if (error instanceof GoogleMapsScraperError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new GoogleMapsScraperError('Request timeout after 60 seconds');
      }

      throw new GoogleMapsScraperError(
        `Failed to fetch places: ${error.message}`,
        undefined,
        error,
      );
    }

    throw new GoogleMapsScraperError('Unknown error occurred');
  }
}

/**
 * Test connection to the scraper API
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${SCRAPER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Validate search parameters
 */
export function validateSearchParams(params: SearchParams): string[] {
  const errors: string[] = [];

  if (!params.query || params.query.trim().length === 0) {
    errors.push('Query is required');
  }

  if (params.maxPlaces < 1 || params.maxPlaces > 100) {
    errors.push('Max places must be between 1 and 100');
  }

  if (!params.lang || params.lang.length !== 2) {
    errors.push('Language must be a 2-letter code (e.g., "pt", "en")');
  }

  if (params.radius && (params.radius < 1 || params.radius > 50000)) {
    errors.push('Radius must be between 1 and 50000 km');
  }

  return errors;
}

/**
 * Format query for better results
 */
export function formatQuery(
  location: string,
  businessType: string,
): string {
  return `${businessType} em ${location}`;
}

/**
 * Extract location and business type from query
 */
export function parseQuery(query: string): {
  location?: string;
  businessType?: string;
} {
  // Try to split by "em" or "in"
  const match = query.match(/(.+?)\s+(em|in)\s+(.+)/i);

  if (match) {
    return {
      businessType: match[1]?.trim(),
      location: match[3]?.trim(),
    };
  }

  return { businessType: query };
}
