'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSidebar } from '@kit/ui/shadcn-sidebar';
import { ListsSidebarContent } from '../lists/_components/lists-sidebar-content';

export function ListsSidebarWrapper() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Only render on lists route
  if (!pathname?.startsWith('/home/lists')) {
    return null;
  }

  return (
    <ListsSidebarContent 
      selectedListId={selectedListId}
      onSelectList={setSelectedListId}
      isOpen={open}
    />
  );
}
