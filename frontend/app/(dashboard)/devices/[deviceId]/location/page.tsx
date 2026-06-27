"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { LocationInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Satellite, Navigation, Crosshair } from "lucide-react"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  )
}

export default function LocationPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [loc, setLoc] = useState<LocationInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.location.get(deviceId).then(setLoc).catch((e) => setError(e.message))
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!loc) return <div className="text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={loc.location_enabled ? "success" : "secondary"}>
                {loc.location_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Satellite className="h-4 w-4" /> GPS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={loc.is_gps_enabled ? "success" : "secondary"}>
                {loc.is_gps_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Navigation className="h-4 w-4" /> Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={loc.is_network_enabled ? "success" : "secondary"}>
                {loc.is_network_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Crosshair className="h-4 w-4" /> GPS Fix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={loc.gps_started ? "success" : "secondary"}>
                {loc.gps_started ? "Active" : "Inactive"}
              </Badge>
              {loc.gps_fix_interval != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Interval: {loc.gps_fix_interval}ms
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" /> Location Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loc.providers.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{p.name}</span>
                  <Badge variant={p.enabled ? "success" : "secondary"}>
                    {p.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-sm space-y-1 bg-muted/30 rounded p-3">
                  {p.power_usage && (
                    <InfoRow label="Power" value={p.power_usage} />
                  )}
                  {p.accuracy_type && (
                    <InfoRow label="Accuracy" value={p.accuracy_type} />
                  )}
                  {p.requires && p.requires.length > 0 && (
                    <InfoRow label="Requires" value={p.requires.join(", ")} />
                  )}
                  {(p.last_latitude != null && p.last_longitude != null) && (
                    <>
                      <Separator />
                      <InfoRow label="Latitude" value={p.last_latitude.toFixed(6)} />
                      <InfoRow label="Longitude" value={p.last_longitude.toFixed(6)} />
                      {p.last_altitude != null && (
                        <InfoRow label="Altitude" value={`${p.last_altitude.toFixed(1)} m`} />
                      )}
                      {p.last_accuracy != null && (
                        <InfoRow label="Accuracy" value={`${p.last_accuracy.toFixed(1)} m`} />
                      )}
                      {p.last_vertical_accuracy != null && (
                        <InfoRow label="Vert. Accuracy" value={`${p.last_vertical_accuracy.toFixed(1)} m`} />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {loc.providers.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No location providers found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
