"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { NetworkInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Network, Wifi, Bluetooth, Nfc, Globe } from "lucide-react"
import { SensitiveField } from "@/components/ui/sensitive-field"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value ?? "—"}</span>
    </div>
  )
}

export default function NetworkPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [net, setNet] = useState<NetworkInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.network.get(deviceId).then(setNet).catch(setError)
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!net) return <div className="text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4" /> Cellular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Network Type" value={net.network_type ?? "—"} />
            <Separator />
            <InfoRow label="Operator" value={net.operator ?? "—"} />
            <Separator />
            <InfoRow
              label="Roaming"
              value={<Badge variant={net.is_roaming ? "warning" : "secondary"}>{net.is_roaming ? "Yes" : "No"}</Badge>}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" /> Interfaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Wi-Fi"
              value={<Badge variant={false ? "success" : "secondary"}>Available</Badge>}
            />
            <Separator />
            <InfoRow
              label="Bluetooth"
              value={<Badge variant="success">Available</Badge>}
            />
            <Separator />
            <InfoRow
              label="NFC"
              value={<Badge variant="success">Available</Badge>}
            />
          </CardContent>
        </Card>

        {net.sims.map((sim) => (
          <Card key={sim.slot}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-4 w-4" /> SIM {sim.slot}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="State"
                value={
                  <Badge variant={sim.state === "loaded" ? "success" : "destructive"}>
                    {sim.state}
                  </Badge>
                }
              />
              <Separator />
              <InfoRow label="Operator" value={sim.operator ?? "—"} />
              <Separator />
              <InfoRow label="Country" value={sim.country ?? "—"} />
              <Separator />
              <InfoRow label="IMEI" value={<SensitiveField value={sim.imei} className="font-mono text-xs" />} />
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
