import type { Device } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone, Battery, CheckCircle, AlertTriangle } from "lucide-react"

interface StatsCardsProps {
  devices: Device[]
}

export function StatsCards({ devices }: StatsCardsProps) {
  const total = devices.length
  const connected = devices.filter((d) => d.status === "device").length
  const unauthorized = devices.filter((d) => d.status === "unauthorized").length
  const avgBattery = connected > 0
    ? Math.round(
        devices
          .filter((d) => d.battery_level !== null)
          .reduce((sum, d) => sum + (d.battery_level ?? 0), 0) /
          devices.filter((d) => d.battery_level !== null).length
      )
    : null

  const stats = [
    {
      title: "Total Devices",
      value: total,
      icon: Smartphone,
      description: "Detected via ADB",
    },
    {
      title: "Connected",
      value: connected,
      icon: CheckCircle,
      description: "Authorized & ready",
      variant: "success" as const,
    },
    {
      title: "Unauthorized",
      value: unauthorized,
      icon: AlertTriangle,
      description: "Accept debug prompt on device",
      variant: "warning" as const,
    },
    {
      title: "Avg Battery",
      value: avgBattery !== null ? `${avgBattery}%` : "N/A",
      icon: Battery,
      description: "Across all devices",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
