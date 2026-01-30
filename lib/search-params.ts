import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
} from "nuqs/server"

export const searchParamsParsers = {
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  category: parseAsString.withDefault(""),
  sort: parseAsString.withDefault("last_commit"),
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
