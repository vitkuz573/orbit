"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { useDeviceStore } from "@/store"
import { cn } from "@/lib/utils"
import {
  Info,
  Cpu,
  HardDrive,
  Battery,
  Network,
  Grid3X3,
  FileText,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SensitiveField } from "@/components/ui/sensitive-field"

const tabs = [
  { label: "Overview", icon: Info, href: "" },
  { label: "System", icon: Cpu, href: "/system" },
  { label: "Storage", icon: HardDrive, href: "/storage" },
  { label: "Battery", icon: Battery, href: "/battery" },
  { label: "Network", icon: Network, href: "/network" },
  { label: "Apps", icon: Grid3X3, href: "/apps" },
  { label: "Report", icon: FileText, href: "/report" },
]

export default function DeviceDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const device = useDeviceStore((s) =>
    s.devices.find((d) => d.id === deviceId)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/devices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {device?.market_name ?? device?.model ?? "Unknown Device"}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {device?.model ? `${device.model} · ` : ""}<SensitiveField value={deviceId} />
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b pb-1 overflow-x-auto">
        {tabs.map((tab) => {
          const basePath = `/devices/${encodeURIComponent(deviceId)}`
          const tabPath = `${basePath}${tab.href}`
          const isActive = pathname === tabPath || (tab.href !== "" && pathname.startsWith(tabPath))
            || (tab.href === "" && pathname === basePath)

          return (
            <Link
              key={tab.href}
              href={tabPath}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
                isActive
                  ? "bg-background border border-b-0 border-border text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div>{children}</div>
    </div>
  )
}
