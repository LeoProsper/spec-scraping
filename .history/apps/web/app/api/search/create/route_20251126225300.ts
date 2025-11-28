import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import {
  searchPlaces,
  validateSearchParams,
  GoogleMapsScraperError,
} from '@kit/kaix-scout/services';
import type { CreateSearchInput, SearchParams } from '@kit/kaix-scout/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' }, success: false },
        { status: 401 },
      );
    }

    // Get request body
    const body = (await request.json()) as CreateSearchInput;

    // Default values
    const searchParams: SearchParams = {
      query: body.query,
      maxPlaces: body.maxPlaces || 20,
      lang: body.lang || 'pt',
      radius: body.radius,
      category: body.category,
    };

    // Validate parameters
    const validationErrors = validateSearchParams(searchParams);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid parameters',
            details: validationErrors,
          },
          success: false,
        },
        { status: 400 },
      );
    }

    // Check user plan and limits
    const { data: account } = await supabase
      .from('accounts')
      .select('plan, searches_count, searches_limit')
      .eq('id', user.id)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: { message: 'Account not found' }, success: false },
        { status: 404 },
      );
    }

    // Check search limit
    if (
      account.plan === 'free' &&
      account.searches_count >= account.searches_limit
    ) {
      return NextResponse.json(
        {
          error: {
            message: 'Search limit reached. Upgrade to premium for unlimited searches.',
          },
          success: false,
        },
        { status: 403 },
      );
    }

    // Check max places based on plan
    const maxAllowed = account.plan === 'free' ? 20 : 100;
    if (searchParams.maxPlaces > maxAllowed) {
      return NextResponse.json(
        {
          error: {
            message: `Max places for ${account.plan} plan is ${maxAllowed}`,
          },
          success: false,
        },
        { status: 403 },
      );
    }

    // Create search record
    const { data: search, error: insertError } = await supabase
      .from('searches')
      .insert({
        user_id: user.id,
        query: searchParams.query,
        max_places: searchParams.maxPlaces,
        lang: searchParams.lang,
        radius: searchParams.radius,
        category: searchParams.category,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !search) {
      console.error('[API] Error creating search:', insertError);
      return NextResponse.json(
        {
          error: { message: 'Failed to create search' },
          success: false,
        },
        { status: 500 },
      );
    }

    // Process search in background (don't await)
    processSearch(search.id, searchParams).catch((error) => {
      console.error('[API] Background search processing error:', error);
    });

    return NextResponse.json(
      {
        data: {
          searchId: search.id,
          status: 'processing',
          message: 'Search started. Check status at /api/search/{searchId}',
        },
        success: true,
      },
      { status: 202 }, // Accepted
    );
  } catch (error) {
    console.error('[API] Error in search/create:', error);

    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        success: false,
      },
      { status: 500 },
    );
  }
}

/**
 * Process search in background
 */
async function processSearch(searchId: string, params: SearchParams) {
  const supabase = getSupabaseServerClient();

  try {
    console.log(`[Background] Processing search ${searchId}`);

    // Call Google Maps Scraper
    const result = await searchPlaces(params);

    console.log(`[Background] Found ${result.total} places for search ${searchId}`);

    // Insert companies
    if (result.places.length > 0) {
      const companies = result.places.map((place) => ({
        search_id: searchId,
        place_id: place.place_id,
        name: place.name,
        address: place.address,
        latitude: place.coordinates.latitude,
        longitude: place.coordinates.longitude,
        phone: place.phone,
        website: place.website,
        rating: place.rating,
        reviews_count: place.reviews_count,
        categories: place.categories,
        google_maps_link: place.link,
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('companies')
        .insert(companies);

      if (insertError) {
        console.error('[Background] Error inserting companies:', insertError);
        throw insertError;
      }
    }

    // Update search status
    await supabase
      .from('searches')
      .update({
        status: 'completed',
        total_results: result.total,
        completed_at: new Date().toISOString(),
      })
      .eq('id', searchId);

    console.log(`[Background] Search ${searchId} completed successfully`);
  } catch (error) {
    console.error(`[Background] Error processing search ${searchId}:`, error);

    // Update search with error
    await supabase
      .from('searches')
      .update({
        status: 'error',
        error_message:
          error instanceof GoogleMapsScraperError
            ? error.message
            : 'Unknown error',
      })
      .eq('id', searchId);
  }
}
