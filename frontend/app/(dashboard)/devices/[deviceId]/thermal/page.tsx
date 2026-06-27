"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { ThermalZone } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Thermometer } from "lucide-react"
import { cn } from "@/lib/utils"

function tempColor(temp: number): string {
  if (temp < 40) return "text-green-500"
  if (temp < 60) return "text-yellow-500"
  if (temp < 80) return "text-orange-500"
  return "text-red-500"
}

function tempBg(temp: number): string {
  if (temp < 40) return "bg-green-500"
  if (temp < 60) return "bg-yellow-500"
  if (temp < 80) return "bg-orange-500"
  return "bg-red-500"
}

export default function ThermalPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [zones, setZones] = useState<ThermalZone[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.thermal.get(deviceId).then((d) => setZones(d.zones)).catch((e) => setError(e.message))
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!zones) return <div className="text-muted-foreground">Loading...</div>

  const maxTemp = Math.max(...zones.map((z) => z.temp_c), 0)
  const scaleMax = Math.max(maxTemp * 1.2, 60)

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Thermometer className="h-4 w-4" /> Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zones.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Thermometer className="h-4 w-4" /> Max Temp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", tempColor(maxTemp))}>{maxTemp.toFixed(1)}°C</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Thermometer className="h-4 w-4" /> Avg Temp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(zones.reduce((s, z) => s + z.temp_c, 0) / zones.length).toFixed(1)}°C
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Thermometer className="h-4 w-4" /> Thermal Zones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {zones.map((z, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium truncate min-w-0">{z.name}</span>
                  <span className={cn("font-mono font-bold", tempColor(z.temp_c))}>
                    {z.temp_c.toFixed(1)}°C
                  </span>
                </div>
                <Progress
                  value={(z.temp_c / scaleMax) * 100}
                  className={cn("h-2", tempBg(z.temp_c))}
                />
              </div>
            ))}
            {zones.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No thermal zones available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
