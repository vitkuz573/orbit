"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Smartphone,
  Settings,
  Terminal,
  FileText,
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Devices",
    icon: Smartphone,
    href: "/devices",
  },
  {
    label: "Shell",
    icon: Terminal,
    href: "/shell",
  },
  {
    label: "Reports",
    icon: FileText,
    href: "/reports",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-6 font-semibold tracking-tight">
        <span className="text-lg">Orbit</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {routes.map((route) => {
          const isActive = pathname === route.href || pathname.startsWith(route.href + "/")
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
