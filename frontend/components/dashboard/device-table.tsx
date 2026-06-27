import Link from "next/link"
import type { Device } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Smartphone, Battery, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { SensitiveField } from "@/components/ui/sensitive-field"

interface DeviceTableProps {
  devices: Device[]
}

export function DeviceTable({ devices }: DeviceTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>IP / Serial</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>OS</TableHead>
          <TableHead className="w-40">Battery</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device.id}>
            <TableCell>
              <Link
                href={`/devices/${encodeURIComponent(device.id)}`}
                className="flex items-center gap-3 hover:underline"
              >
                <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium truncate max-w-[200px]">
                  {device.market_name ?? device.model ?? "Unknown Device"}
                </span>
              </Link>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {device.model || "—"}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              <SensitiveField value={device.id} />
            </TableCell>
            <TableCell>
              <Badge
                variant={device.status === "device" ? "success"
                  : device.status === "unauthorized" ? "warning"
                  : "destructive"}
              >
                {device.status}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {device.manufacturer ?? "Unknown"}
              {device.android_version && <> · Android {device.android_version}</>}
            </TableCell>
            <TableCell>
              {device.battery_level !== null ? (
                <div className="flex items-center gap-2">
                  <Progress value={device.battery_level} className="h-2 flex-1" />
                  <span className={cn(
                    "text-xs font-medium tabular-nums shrink-0 w-10 text-right",
                    device.is_charging && "text-green-500"
                  )}>
                    {device.battery_level}%
                    {device.is_charging && <Zap className="inline h-3 w-3 ml-0.5 -mt-0.5" />}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}


