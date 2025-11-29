'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useListsContext } from '../lists/layout';

// Lazy load para otimizar
const ListsSidebarContent = dynamic(
  () => import('../lists/_components/lists-sidebar-content').then(mod => ({ default: mod.ListsSidebarContent })),
  { ssr: false }
);

export function ListsSidebarWrapper() {
  const pathname = usePathname();

  // Only render on lists route
  if (!pathname?.startsWith('/home/lists')) {
    return null;
  }

  // Hook para acessar/modificar selectedListId
  let selectedListId: string | null = null;
  let setSelectedListId: ((id: string | null) => void) | null = null;

  try {
    const context = useListsContext();
    selectedListId = context.selectedListId;
    setSelectedListId = context.setSelectedListId;
  } catch {
    // Context não disponível (não está na rota de listas)
    return null;
  }

  if (!setSelectedListId) {
    return null;
  }

  return (
    <ListsSidebarContent 
      selectedListId={selectedListId}
      onSelectList={setSelectedListId}
    />
  );
}
