import { ImageResponse } from "next/og"
import { getSkillBySlug } from "@/lib/db/queries"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

type Props = {
  params: Promise<{
    owner: string
    name: string
  }>
}

function getFontSize(text: string): number {
  const len = text.length
  if (len <= 15) return 80
  if (len <= 25) return 64
  if (len <= 35) return 52
  return 44
}

export default async function SkillOGImage({ params }: Props) {
  const { owner, name: slug } = await params
  const skill = await getSkillBySlug(owner, slug)

  if (!skill) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#000",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "32px", color: "#3f3f46", display: "flex" }}>
            skill not found
          </div>
        </div>
      ),
      size
    )
  }

  const fontSize = getFontSize(skill.name)

  return new ImageResponse(
    (
      <div
        style={{
          background: "#000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: "0",
            top: "0",
            bottom: "0",
            width: "6px",
            background: "linear-gradient(180deg, #06b6d4, #8b5cf6)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "64px 80px",
            height: "100%",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 32 32">
                <path d="M16 2L30 24H2L16 2Z" fill="#fff" />
                <path d="M16 10L24 24H8L16 10Z" fill="#000" />
                <rect x="13" y="19" width="6" height="6" rx="1" fill="#06b6d4" />
              </svg>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#71717a",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                AGNXI
              </div>
            </div>
            {skill.stars && skill.stars > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "rgba(250,204,21,0.1)",
                  border: "1px solid rgba(250,204,21,0.2)",
                  borderRadius: "100px",
                }}
              >
                <span style={{ fontSize: "20px", display: "flex" }}>★</span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#facc15",
                    display: "flex",
                  }}
                >
                  {skill.stars.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Main content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              gap: "20px",
            }}
          >
            {/* Skill name */}
            <div
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                display: "flex",
              }}
            >
              {skill.name}
            </div>

            {/* Description */}
            {skill.description && (
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 400,
                  color: "#52525b",
                  lineHeight: 1.4,
                  maxWidth: "900px",
                  display: "flex",
                }}
              >
                {skill.description.length > 100
                  ? `${skill.description.slice(0, 100)}…`
                  : skill.description}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "16px",
                background: "#18181b",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "#71717a",
              }}
            >
              {owner.slice(0, 2).toUpperCase()}
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#06b6d4",
                display: "flex",
              }}
            >
              {owner}
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#27272a",
                display: "flex",
              }}
            >
              /
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#3f3f46",
                display: "flex",
              }}
            >
              {skill.repo}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
