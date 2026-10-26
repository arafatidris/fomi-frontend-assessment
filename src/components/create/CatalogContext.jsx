'use client';

import { createContext, useContext } from 'react';

/** Read-only data resolved on the server: library history, styles, community picks. */
const CatalogContext = createContext(null);

export function CatalogProvider({ catalog, children }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside <CatalogProvider>.');
  return context;
}
