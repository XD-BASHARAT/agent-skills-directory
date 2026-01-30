export type CategoryDefinition = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  keywords: readonly string[]
  priorityKeywords: readonly string[]
  negativeKeywords: readonly string[]
}

export const CATEGORIES = [
  {
    id: "llms-models",
    slug: "llms-models",
    name: "LLMs & Models",
    description: "Artificial intelligence, LLMs, and machine learning tools",
    icon: "🤖",
    color: "#8B5CF6",
    order: 1,
    keywords: [
      "llm", "gpt", "openai", "claude", "anthropic", "gemini", "ollama",
      "langchain", "machine learning", "ml", "transformer", "embedding",
      "chatgpt", "llama", "mistral", "groq", "huggingface", "model", "prompt",
      "inference", "fine-tune", "rag", "vector", "semantic", "chat", "conversation",
    ],
    priorityKeywords: ["llm", "gpt", "openai", "claude", "anthropic", "chatgpt", "chat"],
    negativeKeywords: [
      "component", "ui", "frontend", "react component", "vue component",
      "skill", "skills", "discovery", "install", "search", "web search",
      "workflow", "automation", "agent",
    ],
  },
  {
    id: "data-analytics",
    slug: "data-analytics",
    name: "Data & Analytics",
    description: "Data processing, analytics, and database tools",
    icon: "📊",
    color: "#3B82F6",
    order: 2,
    keywords: [
      "data", "analytics", "database", "sql", "postgres", "mysql", "mongodb",
      "redis", "elasticsearch", "bigquery", "snowflake", "dbt", "etl", "pipeline",
      "warehouse", "visualization", "chart", "dashboard", "metrics", "bi",
      "tableau", "powerbi", "grafana", "prometheus", "pandas", "numpy", "query",
    ],
    priorityKeywords: ["database", "sql", "postgres", "mysql", "mongodb", "query"],
    negativeKeywords: [
      "api", "rest", "graphql", "component",
      "skill", "skills", "discovery",
    ],
  },
  {
    id: "coding-development",
    slug: "coding-development",
    name: "Coding & Development",
    description: "Frontend, backend, and fullstack web development",
    icon: "💻",
    color: "#10B981",
    order: 3,
    keywords: [
      "react", "vue", "angular", "svelte", "next", "nuxt", "remix", "astro",
      "typescript", "javascript", "node", "python", "rust", "go", "java",
      "frontend", "backend", "fullstack", "rest", "graphql", "trpc",
      "tailwind", "css", "html", "component", "library", "framework", "sdk",
      "export", "code generation", "generator", "convert to code", "code",
    ],
    priorityKeywords: ["react", "vue", "angular", "typescript", "javascript", "component", "code"],
    negativeKeywords: ["chat", "conversation", "llm", "ai chat"],
  },
  {
    id: "mobile",
    slug: "mobile",
    name: "Mobile",
    description: "iOS, Android, and cross-platform mobile development",
    icon: "📱",
    color: "#F59E0B",
    order: 4,
    keywords: [
      "ios", "android", "react native", "flutter", "swift", "kotlin",
      "mobile", "app", "expo", "capacitor", "cordova", "ionic", "swiftui",
      "jetpack compose", "xcode", "android studio",
    ],
    priorityKeywords: ["ios", "android", "react native", "flutter", "mobile app"],
    negativeKeywords: [
      "web", "browser", "desktop",
      "figma", "design", "export",
      "ui", "ux",
    ],
  },
  {
    id: "automation-agents",
    slug: "automation-agents",
    name: "Automation & Agents",
    description: "CI/CD, cloud, and infrastructure automation",
    icon: "⚡",
    color: "#EF4444",
    order: 5,
    keywords: [
      "automation", "agent", "workflow", "cicd", "ci/cd", "pipeline",
      "github actions", "jenkins", "terraform", "pulumi", "ansible",
      "kubernetes", "k8s", "docker", "container", "aws", "azure", "gcp",
      "cloud", "serverless", "lambda", "cron", "schedule", "task", "bot",
      "scraper", "crawler", "mcp", "tool", "search", "web search", "skill",
      "skills", "plugin", "extension", "discovery", "install",
    ],
    priorityKeywords: [
      "automation", "agent", "workflow", "ci/cd", "skill", "skills",
      "search", "web search", "discovery",
    ],
    negativeKeywords: ["component", "ui", "design", "chat", "conversation"],
  },
  {
    id: "security",
    slug: "security",
    name: "Security",
    description: "Security, authentication, and encryption tools",
    icon: "🔒",
    color: "#EC4899",
    order: 6,
    keywords: [
      "security", "auth", "authentication", "authorization", "oauth", "jwt",
      "encryption", "ssl", "tls", "certificate", "password", "hash", "crypto",
      "vulnerability", "scan", "audit", "compliance", "firewall", "waf",
      "penetration", "pentest", "sast", "dast",
    ],
    priorityKeywords: ["security", "auth", "authentication", "jwt", "encryption"],
    negativeKeywords: [],
  },
  {
    id: "dev-tools",
    slug: "dev-tools",
    name: "Dev Tools",
    description: "Git workflows and version control tools",
    icon: "🔧",
    color: "#6366F1",
    order: 7,
    keywords: [
      "git", "github", "gitlab", "bitbucket", "version control", "vcs",
      "cli", "terminal", "shell", "bash", "zsh", "editor", "vscode", "vim",
      "neovim", "ide", "debugger", "profiler", "linter", "formatter",
      "prettier", "eslint", "test", "jest", "vitest", "playwright",
      "skill", "skills", "plugin", "extension", "tool", "github actions",
      "discovery",
    ],
    priorityKeywords: [
      "git", "github", "cli", "skill", "skills", "plugin",
      "github actions", "discovery",
    ],
    negativeKeywords: ["chat", "conversation", "llm"],
  },
  {
    id: "business-productivity",
    slug: "business-productivity",
    name: "Business & Productivity",
    description: "Workflow automation and productivity tools",
    icon: "📈",
    color: "#14B8A6",
    order: 8,
    keywords: [
      "productivity", "workflow", "notion", "slack", "discord", "teams",
      "email", "calendar", "task", "project", "management", "crm", "erp",
      "salesforce", "hubspot", "airtable", "zapier", "n8n", "make",
      "spreadsheet", "excel", "sheets", "report", "invoice",
    ],
    priorityKeywords: ["notion", "slack", "productivity", "crm", "project management"],
    negativeKeywords: [
      "code", "programming", "development",
      "github", "actions", "ci/cd", "workflow",
      "automation", "agent",
    ],
  },
  {
    id: "writing-content",
    slug: "writing-content",
    name: "Writing & Content",
    description: "Content management and CMS tools",
    icon: "✍️",
    color: "#F97316",
    order: 9,
    keywords: [
      "writing", "content", "cms", "blog", "markdown", "docs", "documentation",
      "readme", "wiki", "strapi", "sanity", "contentful", "wordpress",
      "ghost", "medium", "seo", "copywriting", "translation", "i18n",
      "editor", "markdown editor",
    ],
    priorityKeywords: ["writing", "content", "cms", "markdown", "docs"],
    negativeKeywords: ["code", "programming", "component"],
  },
  {
    id: "design-creative",
    slug: "design-creative",
    name: "Design & Creative",
    description: "UI/UX design and component libraries",
    icon: "🎨",
    color: "#A855F7",
    order: 10,
    keywords: [
      "design", "ui", "ux", "figma", "sketch", "adobe", "photoshop",
      "illustrator", "canva", "image", "icon", "logo", "animation",
      "video", "audio", "music", "3d", "blender", "unity", "game",
      "creative", "art", "graphic", "color", "font", "typography", "export",
    ],
    priorityKeywords: ["figma", "design", "ui", "ux", "sketch"],
    negativeKeywords: [],
  },
] as const satisfies readonly CategoryDefinition[]

export type CategoryId = (typeof CATEGORIES)[number]["id"]
export type CategorySlug = (typeof CATEGORIES)[number]["slug"]

const categoryByIdMap = new Map<string, CategoryDefinition>(
  CATEGORIES.map((c) => [c.id, c])
)
const categoryBySlugMap = new Map<string, CategoryDefinition>(
  CATEGORIES.map((c) => [c.slug, c])
)

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return categoryByIdMap.get(id)
}

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return categoryBySlugMap.get(slug)
}

export function getCategoriesSorted(): readonly CategoryDefinition[] {
  return CATEGORIES
}

export function getAllCategoryIds(): CategoryId[] {
  return CATEGORIES.map((c) => c.id) as CategoryId[]
}

export function getAllCategorySlugs(): CategorySlug[] {
  return CATEGORIES.map((c) => c.slug) as CategorySlug[]
}

export function toDatabaseCategory(category: CategoryDefinition) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    color: category.color,
    order: category.order,
  }
}
