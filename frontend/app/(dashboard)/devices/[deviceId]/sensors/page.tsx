"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { SensorEntry } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ScrollText, Search } from "lucide-react"

export default function SensorsPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [sensors, setSensors] = useState<SensorEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api.sensors.get(deviceId).then((d) => setSensors(d.sensors)).catch((e) => setError(e.message))
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!sensors) return <div className="text-muted-foreground">Loading...</div>

  const filtered = sensors.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase()) ||
      s.vendor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-4 w-4" /> Sensors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensors.length}</div>
            <p className="text-xs text-muted-foreground">sensors found</p>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sensors..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
          {filtered.map((s, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium leading-tight">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-mono">{s.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-mono">{s.value.toFixed(2)}</span>
                </div>
                {s.vendor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor</span>
                    <span>{s.vendor}</span>
                  </div>
                )}
                {s.power_ma > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Power</span>
                    <span>{s.power_ma.toFixed(1)} mA</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-8">No sensors match</div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
