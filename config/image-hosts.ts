const IMAGE_HOSTNAMES = [
  "avatars.githubusercontent.com",
  "public.blob.vercel-storage.com",
  "wired.business",
  "twelve.tools",
  "uno.directory",
  "startupfa.me",
  "verifieddr.com",
] as const

const IMAGE_HOSTNAME_SUFFIXES = [".public.blob.vercel-storage.com"] as const

function isAllowedImageUrl(rawUrl: string): boolean {
  if (!rawUrl) return false
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== "https:") return false
    if (IMAGE_HOSTNAMES.includes(url.hostname as (typeof IMAGE_HOSTNAMES)[number])) {
      return true
    }
    return IMAGE_HOSTNAME_SUFFIXES.some((suffix) =>
      url.hostname.endsWith(suffix)
    )
  } catch {
    return false
  }
}

export { IMAGE_HOSTNAMES, IMAGE_HOSTNAME_SUFFIXES, isAllowedImageUrl }
