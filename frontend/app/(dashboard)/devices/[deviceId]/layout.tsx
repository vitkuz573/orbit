"use client"

import { useState, useRef, useEffect } from "react"
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
  Activity,
  ScrollText,
  Thermometer,
  Wifi,
  Mouse,
  MapPin,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SensitiveField } from "@/components/ui/sensitive-field"

const primaryTabs = [
  { label: "Overview", icon: Info, href: "" },
  { label: "System", icon: Cpu, href: "/system" },
  { label: "Storage", icon: HardDrive, href: "/storage" },
  { label: "Battery", icon: Battery, href: "/battery" },
  { label: "Network", icon: Network, href: "/network" },
  { label: "Processes", icon: Activity, href: "/processes" },
]

const moreTabs = [
  { label: "Sensors", icon: ScrollText, href: "/sensors" },
  { label: "Thermal", icon: Thermometer, href: "/thermal" },
  { label: "Connectivity", icon: Wifi, href: "/connectivity" },
  { label: "Input", icon: Mouse, href: "/input" },
  { label: "Location", icon: MapPin, href: "/location" },
  { label: "Apps", icon: Grid3X3, href: "/apps" },
  { label: "Report", icon: FileText, href: "/report" },
]

function TabLink({
  tab,
  deviceId,
  pathname,
}: {
  tab: { label: string; icon: React.ElementType; href: string }
  deviceId: string
  pathname: string
}) {
  const basePath = `/devices/${encodeURIComponent(deviceId)}`
  const tabPath = `${basePath}${tab.href}`
  const isActive = pathname === tabPath || (tab.href !== "" && pathname.startsWith(tabPath))
    || (tab.href === "" && pathname === basePath)

  return (
    <Link
      href={tabPath}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-t-md transition-colors shrink-0 border border-b-0 border-transparent",
        isActive
          ? "bg-background border-border text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <tab.icon className="h-3.5 w-3.5" />
      {tab.label}
    </Link>
  )
}

function MoreDropdown({
  tabs,
  deviceId,
  pathname,
}: {
  tabs: { label: string; icon: React.ElementType; href: string }[]
  deviceId: string
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const basePath = `/devices/${encodeURIComponent(deviceId)}`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-t-md transition-colors shrink-0 border border-b-0 border-border text-muted-foreground hover:text-foreground hover:bg-accent/50",
          open && "bg-accent/50"
        )}
      >
        More
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
          {tabs.map((tab) => {
            const tabPath = `${basePath}${tab.href}`
            const isActive = pathname === tabPath || (tab.href !== "" && pathname.startsWith(tabPath))
              || (tab.href === "" && pathname === basePath)

            return (
              <Link
                key={tab.href}
                href={tabPath}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-popover-foreground hover:bg-accent/50"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

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

      <div className="flex gap-0.5 border-b">
        {primaryTabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} deviceId={deviceId} pathname={pathname} />
        ))}
        <MoreDropdown tabs={moreTabs} deviceId={deviceId} pathname={pathname} />
      </div>

      <div>{children}</div>
    </div>
  )
}
