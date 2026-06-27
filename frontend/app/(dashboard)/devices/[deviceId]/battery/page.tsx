"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { BatteryInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Battery, Zap, Thermometer, Activity, Bolt } from "lucide-react"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  )
}

export default function BatteryPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [bat, setBat] = useState<BatteryInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetch = () => api.battery.get(deviceId).then(setBat).catch(setError)
    fetch()
    intervalRef.current = setInterval(fetch, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!bat) return <div className="text-muted-foreground">Loading...</div>

  const statusVariant = bat.is_charging ? "success" as const
    : bat.level < 20 ? "destructive" as const
    : bat.level < 50 ? "warning" as const
    : "default" as const

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6 md:grid-cols-2 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Battery className="h-4 w-4" /> Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl font-bold mb-2">{bat.level}%</div>
              <Badge variant={statusVariant} className="text-sm">
                {bat.is_charging ? "Charging" : bat.status}
              </Badge>
            </div>
            <Progress value={bat.level} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Health" value={<Badge variant="outline">{bat.health}</Badge>} />
            <Separator />
            <InfoRow label="Technology" value={bat.technology} />
            <Separator />
            <InfoRow label="Voltage" value={`${bat.voltage.toFixed(3)} V`} />
            <Separator />
            <InfoRow
              label="Temperature"
              value={
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5" />
                  {bat.temperature.toFixed(1)} °C
                </span>
              }
            />
            {bat.is_charging && bat.is_fast_charge && (
              <>
                <Separator />
                <InfoRow
                  label="Fast Charging"
                  value={
                    <Badge variant="success" className="flex items-center gap-1">
                      <Bolt className="h-3 w-3" />
                      {bat.charging_protocol ?? "Yes"}
                    </Badge>
                  }
                />
              </>
            )}
            {bat.charge_counter != null && bat.charge_counter > 0 && (
              <>
                <Separator />
                <InfoRow label="Charge Counter" value={`${bat.charge_counter} mAh`} />
              </>
            )}
            <Separator />
            <InfoRow label="Power Source" value={bat.power_source.toUpperCase()} />
            {bat.max_charging_current != null && bat.max_charging_current > 0 && (
              <>
                <Separator />
                <InfoRow label="Max Charge Current" value={`${(bat.max_charging_current / 1000).toFixed(1)} A`} />
              </>
            )}
            {bat.max_charging_voltage != null && bat.max_charging_voltage > 0 && (
              <>
                <Separator />
                <InfoRow label="Max Charge Voltage" value={`${(bat.max_charging_voltage / 1000).toFixed(1)} V`} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
