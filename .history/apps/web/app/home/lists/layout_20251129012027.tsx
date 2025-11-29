'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ListsContextValue {
  selectedListId: string | null;
  setSelectedListId: (id: string | null) => void;
}

const ListsContext = createContext<ListsContextValue | undefined>(undefined);

export function useListsContext() {
  const context = useContext(ListsContext);
  if (!context) {
    throw new Error('useListsContext must be used within ListsLayout');
  }
  return context;
}

export default function ListsLayout({ children }: { children: ReactNode }) {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  return (
    <ListsContext.Provider value={{ selectedListId, setSelectedListId }}>
      {children}
    </ListsContext.Provider>
  );
}
