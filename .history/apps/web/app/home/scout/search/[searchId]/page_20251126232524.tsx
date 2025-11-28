import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { SearchResults } from '../../_components/search-results';

interface SearchResultsPageProps {
  params: Promise<{
    searchId: string;
  }>;
}

export default async function SearchResultsPage({
  params,
}: SearchResultsPageProps) {
  const { searchId } = await params;
  const client = getSupabaseServerClient();

  // Get authenticated user
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Fetch search with companies
  const { data: search, error } = await client
    .from('searches')
    .select(
      `
      *,
      companies (
        *,
        website_analysis (*)
      )
    `,
    )
    .eq('id', searchId)
    .eq('user_id', user.id)
    .single();

  if (error || !search) {
    redirect('/home/scout');
  }

  return (
    <div className="container mx-auto py-8">
      <SearchResults search={search} />
    </div>
  );
}
