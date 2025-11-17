"use client"

import { SessionProvider } from "@/components/providers/session-provider"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
