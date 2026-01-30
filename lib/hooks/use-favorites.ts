"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"

export function useFavorites() {
  const { userId, isLoaded: isAuthLoaded } = useAuth()
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = React.useState(false)
  const favoritesRef = React.useRef(favorites)

  React.useEffect(() => {
    favoritesRef.current = favorites
  }, [favorites])

  React.useEffect(() => {
    if (!isAuthLoaded) return

    let isActive = true
    setIsLoaded(false)

    if (!userId) {
      setFavorites(new Set())
      setIsLoaded(true)
      return
    }

    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites")
        if (res.ok) {
          const data = await res.json()
          if (isActive) {
            const next = new Set<string>(data.favorites)
            favoritesRef.current = next
            setFavorites(next)
          }
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error)
      } finally {
        if (isActive) {
          setIsLoaded(true)
        }
      }
    }

    fetchFavorites()

    return () => {
      isActive = false
    }
  }, [userId, isAuthLoaded])

  const updateFavorite = React.useCallback(
    async (skillId: string, action: "add" | "remove") => {
      if (!userId) return false

      const previous = new Set(favoritesRef.current)
      const next = new Set(previous)

      if (action === "add") {
        next.add(skillId)
      } else {
        next.delete(skillId)
      }

      favoritesRef.current = next
      setFavorites(next)

      try {
        const res = await fetch("/api/favorites", {
          method: action === "add" ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ skillId }),
        })

        if (!res.ok) {
          favoritesRef.current = previous
          setFavorites(previous)
          return false
        }
      } catch (error) {
        favoritesRef.current = previous
        setFavorites(previous)
        console.error("Failed to update favorites:", error)
        return false
      }

      return true
    },
    [userId]
  )

  const toggleFavorite = React.useCallback(
    async (skillId: string) => {
      if (!userId) return
      const isFav = favoritesRef.current.has(skillId)
      await updateFavorite(skillId, isFav ? "remove" : "add")
    },
    [updateFavorite, userId]
  )

  const isFavorite = React.useCallback(
    (skillId: string) => favoritesRef.current.has(skillId),
    []
  )

  const addFavorite = React.useCallback(
    async (skillId: string) => {
      if (!userId || favoritesRef.current.has(skillId)) return
      await updateFavorite(skillId, "add")
    },
    [updateFavorite, userId]
  )

  const removeFavorite = React.useCallback(
    async (skillId: string) => {
      if (!userId || !favoritesRef.current.has(skillId)) return
      await updateFavorite(skillId, "remove")
    },
    [updateFavorite, userId]
  )

  return {
    favorites: [...favorites],
    isLoaded,
    isAuthenticated: !!userId,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    count: favorites.size,
  }
}
