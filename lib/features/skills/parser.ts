import { z } from "zod"

/**
 * SKILL.md Parser - Đơn giản hóa theo mô hình claude-plugins-registry
 * Sử dụng Zod để validate schema
 */

// Schema cho SKILL.md frontmatter - chỉ yêu cầu name và description có giá trị
const SkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().optional(),
  license: z.string().optional(),
  compatibility: z.string().optional(),
  "allowed-tools": z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  author: z.string().optional(),
  tags: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
}).passthrough() // Cho phép các fields khác

export type ParsedSkill = z.infer<typeof SkillSchema>

export type ParseResult = {
  success: true
  data: ParsedSkill
} | {
  success: false
  error: string
}

/**
 * Parse SKILL.md content và validate
 */
export function parseSkillMd(content: string): ParseResult {
  // Normalize content
  const normalized = content
    .replace(/^\uFEFF/, "") // Remove BOM
    .replace(/\r\n/g, "\n")
    .trim()

  // Extract frontmatter
  const match = normalized.match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    return { success: false, error: "No YAML frontmatter found" }
  }

  const frontmatter = match[1]

  // Parse YAML (simple key: value)
  const data = parseSimpleYaml(frontmatter)

  // Validate với Zod
  const result = SkillSchema.safeParse(data)

  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`)
    return { success: false, error: issues.join(", ") }
  }

  return { success: true, data: result.data }
}

/**
 * Simple YAML parser cho frontmatter
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = yaml.split("\n")

  let currentKey: string | null = null
  let multilineValue: string[] = []
  let inMultiline = false

  for (const line of lines) {
    // Skip comments and empty lines
    if (!line.trim() || line.trim().startsWith("#")) {
      continue
    }

    // Check for key: value
    const keyMatch = line.match(/^([a-zA-Z][\w-]*)\s*:\s*(.*)$/)

    if (keyMatch && !inMultiline) {
      // Save previous multiline value
      if (currentKey && multilineValue.length > 0) {
        result[currentKey] = multilineValue.join("\n").trim()
      }

      currentKey = keyMatch[1]
      const value = keyMatch[2].trim()

      if (value === "|" || value === ">") {
        // Start multiline
        inMultiline = true
        multilineValue = []
      } else if (value.startsWith("[") && value.endsWith("]")) {
        // Inline array
        result[currentKey] = parseInlineArray(value)
        currentKey = null
      } else if (value) {
        result[currentKey] = stripQuotes(value)
        currentKey = null
      } else {
        multilineValue = []
      }
    } else if (inMultiline && (line.startsWith("  ") || line.startsWith("\t"))) {
      // Continuation of multiline
      multilineValue.push(line.replace(/^(\s\s|\t)/, ""))
    } else if (inMultiline) {
      // End multiline
      if (currentKey) {
        result[currentKey] = multilineValue.join("\n").trim()
      }
      inMultiline = false
      currentKey = null
      multilineValue = []
    }
  }

  // Save last value
  if (currentKey && multilineValue.length > 0) {
    result[currentKey] = multilineValue.join("\n").trim()
  }

  return result
}

function parseInlineArray(value: string): string[] {
  const inner = value.slice(1, -1).trim()
  if (!inner) return []
  return inner.split(",").map(s => stripQuotes(s.trim()))
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

/**
 * Normalize allowed-tools thành array
 */
export function normalizeAllowedTools(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value
  return value.split(/\s+/).filter(Boolean)
}

/**
 * Normalize tags thành array
 */
export function normalizeTags(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value
  return value.split(",").map(t => t.trim()).filter(Boolean)
}
