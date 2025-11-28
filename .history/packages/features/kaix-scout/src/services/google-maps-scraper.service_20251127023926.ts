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
 * Fetch places from Google Maps using the scraper REST API
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
    // Step 1: Create a scraping job
    console.log('[GoogleMapsScraperService] Creating scraping job for query:', params.query);
    
    const jobPayload = {
      name: `Search: ${params.query}`,
      keywords: [params.query],
      depth: 1,
      lang: params.lang,
      max: params.maxPlaces,
      max_time: '5m', // Maximum time to run the job
      ...(params.radius && { radius: params.radius }),
    };

    const createJobResponse = await fetch(`${SCRAPER_URL}/api/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobPayload),
      signal: AbortSignal.timeout(10000),
    });

    if (!createJobResponse.ok) {
      const errorText = await createJobResponse.text();
      throw new GoogleMapsScraperError(
        `Failed to create scraping job: ${createJobResponse.statusText}`,
        createJobResponse.status,
        errorText,
      );
    }

    const jobData = await createJobResponse.json();
    const jobId = jobData.id || jobData.job_id;

    if (!jobId) {
      throw new GoogleMapsScraperError('No job ID returned from scraper API');
    }

    console.log('[GoogleMapsScraperService] Job created with ID:', jobId);

    // Step 2: Poll for results (wait up to 2 minutes)
    const maxAttempts = 24; // 24 attempts * 5 seconds = 2 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
      attempts++;

      const statusResponse = await fetch(`${SCRAPER_URL}/api/v1/jobs/${jobId}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!statusResponse.ok) {
        console.warn('[GoogleMapsScraperService] Failed to check job status, retrying...');
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.status || statusData.state;

      console.log(`[GoogleMapsScraperService] Job status (attempt ${attempts}/${maxAttempts}):`, status);

      // Check if job is complete
      if (status === 'completed' || status === 'done' || status === 'finished') {
        // Step 3: Download results
        const downloadResponse = await fetch(`${SCRAPER_URL}/api/v1/jobs/${jobId}/download`, {
          method: 'GET',
          signal: AbortSignal.timeout(30000),
        });

        if (!downloadResponse.ok) {
          throw new GoogleMapsScraperError(
            `Failed to download results: ${downloadResponse.statusText}`,
            downloadResponse.status,
          );
        }

        const csvText = await downloadResponse.text();
        const places = parseCSVResults(csvText);

        console.log(`[GoogleMapsScraperService] Successfully scraped ${places.length} places`);

        return {
          places,
          total: places.length,
        };
      }

      if (status === 'failed' || status === 'error') {
        throw new GoogleMapsScraperError(`Scraping job failed with status: ${status}`);
      }

      // Continue polling if status is 'running', 'pending', etc.
    }

    throw new GoogleMapsScraperError('Scraping job timeout after 2 minutes');

  } catch (error) {
    if (error instanceof GoogleMapsScraperError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new GoogleMapsScraperError('Request timeout');
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
