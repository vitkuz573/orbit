"use client"

import { useDeviceStore } from "@/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Circle } from "lucide-react"

export function Header() {
  const { devices, loading, fetchDevices, polling } = useDeviceStore()
  const connectedDevices = devices.filter((d) => d.status === "device")

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Circle
            className={`h-2.5 w-2.5 ${connectedDevices.length > 0 ? "fill-green-500 text-green-500" : "fill-muted-foreground text-muted-foreground"}`}
          />
          <span>
            {connectedDevices.length} / {devices.length} devices
          </span>
          {polling && (
            <Badge variant="outline" className="text-xs">
              Auto-refresh
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDevices()}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </header>
  )
}
