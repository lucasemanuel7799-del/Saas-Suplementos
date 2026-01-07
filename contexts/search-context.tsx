"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  isSearchOpen: boolean;
  toggleSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  function toggleSearch() {
    setIsSearchOpen((prev) => !prev);
  }

  function closeSearch() {
    setIsSearchOpen(false);
  }

  return (
    <SearchContext.Provider value={{ isSearchOpen, toggleSearch, closeSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}