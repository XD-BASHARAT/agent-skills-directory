import * as React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

type AdminLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <>{children}</>
}
