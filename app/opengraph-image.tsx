import { ImageResponse } from "next/og"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
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

          {/* Main content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              gap: "24px",
            }}
          >
            <div
              style={{
                fontSize: "72px",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                display: "flex",
              }}
            >
              Browse SKILL.md skills for coding assistants.
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 400,
                color: "#52525b",
                display: "flex",
              }}
            >
              Claude / Cursor / Windsurf / Copilot
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: "18px",
              color: "#3f3f46",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Agent Skills Directory
          </div>
        </div>
      </div>
    ),
    size
  )
}
