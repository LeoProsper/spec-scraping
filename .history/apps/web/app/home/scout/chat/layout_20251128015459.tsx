'use client';

import { SearchHistorySidebar } from './_components/search-history-sidebar';
import { useRouter } from 'next/navigation';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleSelectSearch = (query: string) => {
    // Navegar para página de chat e passar query via URL
    router.push(`/home/scout/chat?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar de Histórico */}
      <div className="w-72 border-r border-border bg-background">
        <SearchHistorySidebar onSelectSearch={handleSelectSearch} />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
