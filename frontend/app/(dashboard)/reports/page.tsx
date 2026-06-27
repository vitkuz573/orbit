"use client"

import { useDeviceStore } from "@/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SensitiveField } from "@/components/ui/sensitive-field"

export default function ReportsPage() {
  const devices = useDeviceStore((s) => s.devices)
  const connectedDevices = devices.filter((d) => d.status === "device")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate comprehensive device reports
        </p>
      </div>

      {connectedDevices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-lg">No connected devices</p>
          <p className="text-muted-foreground text-sm mt-1">
            Connect a device to generate reports
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connectedDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {device.market_name ?? device.model ?? "Unknown Device"}
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {device.model ? `${device.model} · ` : ""}<SensitiveField value={device.id} />
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-mono mb-4"><SensitiveField value={device.id} /></p>
                <Button variant="outline" size="sm" asChild>
                   <Link href={`/devices/${encodeURIComponent(device.id)}/report`}>
                    Generate Report <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
