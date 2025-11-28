/**
 * Google Maps Scraper Service
 * Integration with google-maps-scraper API
 */

import type {
  GoogleMapsPlace,
  ScraperResponse,
  SearchParams,
} from '../types';

const SCRAPER_URL = process.env.GOOGLE_MAPS_SCRAPER_URL || 'http://localhost:3001';
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
 * Fetch places from Google Maps using the custom Puppeteer scraper
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
    console.log('[GoogleMapsScraperService] Scraping for query:', params.query);
    
    // Parse query to extract business type and city
    const parsed = parseQuery(params.query);
    const query = parsed.businessType || params.query;
    const city = parsed.location || 'Brasil';

    const requestBody = {
      query,
      city,
    };

    console.log('[GoogleMapsScraperService] Request:', JSON.stringify(requestBody));

    const response = await fetch(`${SCRAPER_URL}/api/scrape-maps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000), // 2 minutes timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleMapsScraperService] Scraping failed:', errorText);
      throw new GoogleMapsScraperError(
        `Failed to scrape: ${response.statusText}`,
        response.status,
        errorText,
      );
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.businesses)) {
      throw new GoogleMapsScraperError('Invalid response format from scraper');
    }

    // Transform the response to match our GoogleMapsPlace format
    const places: GoogleMapsPlace[] = data.businesses.map((business: any, index: number) => ({
      name: business.name || 'Unknown',
      place_id: `place_${Date.now()}_${index}`,
      coordinates: {
        latitude: 0, // Custom scraper doesn't return coordinates
        longitude: 0,
      },
      address: business.address || '',
      rating: business.rating ? parseFloat(business.rating.toString()) : undefined,
      reviews_count: business.reviewCount ? parseInt(business.reviewCount.toString(), 10) : undefined,
      categories: business.category ? [business.category] : [],
      website: business.website || undefined,
      phone: business.phone || undefined,
      link: `https://maps.google.com/?q=${encodeURIComponent(business.name || '')}`,
      opening_hours: business.openingHours || undefined,
    }));

    console.log(`[GoogleMapsScraperService] Successfully scraped ${places.length} places`);

    return {
      places: places.slice(0, params.maxPlaces), // Limit to requested amount
      total: places.length,
    };

  } catch (error) {
    if (error instanceof GoogleMapsScraperError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new GoogleMapsScraperError('Request timeout after 2 minutes');
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
 * Parse CSV results from the scraper
 */
function parseCSVResults(csvText: string): GoogleMapsPlace[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return []; // No data rows

  const headerLine = lines[0];
  if (!headerLine) return [];

  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  const places: GoogleMapsPlace[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    places.push({
      name: row.title || row.name || 'Unknown',
      place_id: row.cid || row.data_id || `place_${Date.now()}_${i}`,
      coordinates: {
        latitude: parseFloat(row.latitude || row.lat || '0'),
        longitude: parseFloat(row.longitude || row.lng || '0'),
      },
      address: row.address || row.complete_address || '',
      rating: row.review_rating ? parseFloat(row.review_rating) : undefined,
      reviews_count: row.review_count ? parseInt(row.review_count, 10) : undefined,
      categories: row.category ? [row.category] : [],
      website: row.website || undefined,
      phone: row.phone || undefined,
      link: row.link || '',
    });
  }

  return places;
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
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
