import * as React from "react"

type AuthLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>
}
