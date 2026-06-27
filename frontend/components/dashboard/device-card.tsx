import Link from "next/link"
import type { Device } from "@/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Smartphone, Battery, Wifi, Zap } from "lucide-react"
import { SensitiveField } from "@/components/ui/sensitive-field"

interface DeviceCardProps {
  device: Device
}

export function DeviceCard({ device }: DeviceCardProps) {
  const statusVariant = device.status === "device" ? "success" as const
    : device.status === "unauthorized" ? "warning" as const
    : "destructive" as const

  return (
    <Link href={`/devices/${encodeURIComponent(device.id)}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {device.market_name ?? device.model ?? "Unknown Device"}
                </p>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  <SensitiveField value={device.id} />
                </p>
              </div>
            </div>
            <Badge variant={statusVariant} className="shrink-0">
              {device.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wifi className="h-3.5 w-3.5" />
            <span>{device.manufacturer ?? "Unknown"}</span>
            {device.model && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="font-mono">{device.model}</span>
              </>
            )}
            {device.android_version && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span>Android {device.android_version}</span>
              </>
            )}
          </div>
          {device.battery_level !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Battery className="h-3 w-3" />
                  Battery
                </span>
                <span className={device.is_charging ? "text-green-500" : ""}>
                  {device.battery_level}% {device.is_charging && <Zap className="inline h-3 w-3" />}
                </span>
              </div>
              <Progress value={device.battery_level} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
