"use client"

import * as React from "react"
import { useQueryStates, parseAsInteger, parseAsString, parseAsArrayOf } from "nuqs"

import type { SkillListItem, Category } from "@/types"

const DEFAULT_PAGE_SIZE = 32
const SEARCH_DEBOUNCE_MS = 400
const DEFAULT_SORT = "last_commit"

const sortOptions = [
  { value: "recent", label: "Recently Added", aliases: ["recent", "recently_added", "newest"] },
  { value: "stars_desc", label: "Most Stars", aliases: ["stars", "stars_desc", "most_star", "most_stars"] },
  { value: "name_asc", label: "Name (A-Z)", aliases: ["name", "name_asc", "az", "a-z"] },
  { value: "name_desc", label: "Name (Z-A)", aliases: ["name_desc", "za", "z-a", "z-aa"] },
  { value: "last_commit", label: "Last Commit", aliases: ["last_commit", "commit", "repo_updated"] },
] as const

type SortValue = (typeof sortOptions)[number]["value"]

const sortAliasMap = new Map<string, SortValue>()
for (const option of sortOptions) {
  sortAliasMap.set(option.value, option.value)
  for (const alias of option.aliases) {
    sortAliasMap.set(alias, option.value)
  }
}

type InitialData = {
  skills: SkillListItem[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

type UseSkillsSearchOptions = {
  initialData?: InitialData
  initialCategories?: Category[]
}

function useSkillsSearch({ initialData, initialCategories }: UseSkillsSearchOptions = {}) {
  const [mounted, setMounted] = React.useState(false)
  const [skills, setSkills] = React.useState<SkillListItem[]>(initialData?.skills ?? [])
  const [categories, setCategories] = React.useState<Category[]>(initialCategories ?? [])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [total, setTotal] = React.useState(initialData?.total ?? 0)
  const [pageSize, setPageSize] = React.useState(initialData?.perPage ?? DEFAULT_PAGE_SIZE)
  const hasInitialData = React.useRef(!!initialData)

  const [queryState, setQuery] = useQueryStates({
    q: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1).withOptions({ history: "push" }),
    categories: parseAsArrayOf(parseAsString).withDefault([]),
    sort: parseAsString.withDefault(DEFAULT_SORT),
  })

  const [inputValue, setInputValue] = React.useState(queryState.q)
  const [debouncedQuery, setDebouncedQuery] = React.useState(queryState.q)

  const activeSort = sortAliasMap.get(queryState.sort) ?? DEFAULT_SORT
  const activeSortLabel = sortOptions.find((o) => o.value === activeSort)?.label ?? "Last Commit"
  const totalPages = Math.ceil(total / pageSize)
  const isDefaultView = !debouncedQuery && queryState.categories.length === 0 && queryState.page === 1 && activeSort === DEFAULT_SORT

  // Mark as mounted after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync input with URL query
  React.useEffect(() => {
    setInputValue(queryState.q)
  }, [queryState.q])

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue)
      if (inputValue !== queryState.q) {
        setQuery({ q: inputValue || null, page: 1 })
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [inputValue, queryState.q, setQuery])

  // Fetch categories if not provided
  React.useEffect(() => {
    if (initialCategories && initialCategories.length > 0) return
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories)
        }
      } catch {
        console.error("Failed to fetch categories")
      }
    }
    fetchCategories()
  }, [initialCategories])

  // Fetch skills when query changes
  React.useEffect(() => {
    if (hasInitialData.current && isDefaultView) {
      hasInitialData.current = false
      return
    }
    if (!mounted) return

    const abortController = new AbortController()

    async function fetchSkills() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (debouncedQuery) params.set("q", debouncedQuery)
        if (queryState.categories.length > 0) params.set("categories", queryState.categories.join(","))
        params.set("page", queryState.page.toString())
        params.set("perPage", pageSize.toString())
        params.set("sort", activeSort)

        const response = await fetch(`/api/skills?${params}`, {
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch skills" }))
          throw new Error(errorData.error || errorData.details || "Failed to fetch skills")
        }

        const data = await response.json()
        
        // Validate response data
        if (!data.skills || !Array.isArray(data.skills)) {
          throw new Error("Invalid response format")
        }
        
        setSkills(data.skills)
        setTotal(data.total ?? 0)
        if (typeof data.perPage === "number" && data.perPage > 0 && data.perPage !== pageSize) {
          setPageSize(data.perPage)
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        const errorMessage = err instanceof Error ? err.message : "An error occurred"
        setError(errorMessage)
        console.error("Skills fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
    return () => abortController.abort()
  }, [debouncedQuery, queryState.page, queryState.categories, activeSort, pageSize, isDefaultView, mounted])

  // Auto-correct page if exceeds totalPages
  React.useEffect(() => {
    if (totalPages > 0 && queryState.page > totalPages) {
      setQuery({ page: totalPages })
    }
  }, [totalPages, queryState.page, setQuery])

  // Scroll to top on page change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [queryState.page])

  const handleSearch = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setDebouncedQuery(inputValue)
    setQuery({ q: inputValue || null, page: 1 })
  }, [inputValue, setQuery])

  const handleClearFilters = React.useCallback(() => {
    setInputValue("")
    setDebouncedQuery("")
    setQuery({ q: null, categories: [], page: 1 })
  }, [setQuery])

  const handleSortChange = React.useCallback((newSort: string) => {
    setQuery({ sort: newSort, page: 1 })
  }, [setQuery])

  const handleClearSearch = React.useCallback(() => {
    setInputValue("")
    setDebouncedQuery("")
    setQuery({ q: null, page: 1 })
  }, [setQuery])

  const handleCategoryToggle = React.useCallback((slug: string) => {
    setQuery((prev) => {
      const next = prev.categories.includes(slug)
        ? prev.categories.filter((s) => s !== slug)
        : [...prev.categories, slug]
      return { categories: next, page: 1 }
    })
  }, [setQuery])

  const handlePageChange = React.useCallback((newPage: number) => {
    setQuery({ page: newPage })
  }, [setQuery])

  return {
    // Data
    skills,
    categories,
    total,
    totalPages,
    pageSize,

    // State
    loading,
    error,
    inputValue,
    searchQuery: debouncedQuery,
    selectedCategories: queryState.categories,
    page: queryState.page,
    sort: activeSort,
    sortLabel: activeSortLabel,
    sortOptions,

    // Handlers
    setInputValue,
    handleSearch,
    handleClearFilters,
    handleSortChange,
    handleClearSearch,
    handleCategoryToggle,
    handlePageChange,
  }
}

export { useSkillsSearch, sortOptions, DEFAULT_SORT }
export type { UseSkillsSearchOptions, InitialData, SortValue }
