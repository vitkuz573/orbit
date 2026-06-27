"use client"

import { useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useDeviceStore } from "@/store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fetchDevices = useDeviceStore((s) => s.fetchDevices)

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
