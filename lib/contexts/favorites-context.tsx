"use client"

import * as React from "react"
import { useFavorites } from "@/lib/hooks/use-favorites"

type FavoritesContextType = ReturnType<typeof useFavorites>

const FavoritesContext = React.createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const favorites = useFavorites()
  const value = React.useMemo(
    () => favorites,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally tracking specific properties to avoid unnecessary re-renders
    [
      favorites.favorites,
      favorites.isLoaded,
      favorites.isAuthenticated,
      favorites.count,
    ]
  )
  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavoritesContext() {
  const context = React.useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavoritesContext must be used within FavoritesProvider")
  }
  return context
}
