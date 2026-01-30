import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { siteConfig } from "@/config/site"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExternalUrl(url: string): string {
  if (!url || url.startsWith("/") || url.startsWith("#")) {
    return url
  }
  try {
    const urlObj = new URL(url)
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return "#"
    }
    const siteHost = new URL(siteConfig.url).host
    if (urlObj.host === siteHost) {
      return url
    }
    urlObj.searchParams.set("ref", siteHost)
    return urlObj.toString()
  } catch {
    return "#"
  }
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
