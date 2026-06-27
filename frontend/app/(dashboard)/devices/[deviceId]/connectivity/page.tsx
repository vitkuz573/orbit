"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { InterfaceInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Wifi, Globe } from "lucide-react"

export default function ConnectivityPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [ifaces, setIfaces] = useState<InterfaceInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.connectivity.get(deviceId).then((d) => setIfaces(d.interfaces)).catch((e) => setError(e.message))
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!ifaces) return <div className="text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6 md:grid-cols-2 min-w-0">
        {ifaces.map((iface) => (
          <Card key={iface.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {iface.name.includes("wlan") ? (
                  <Wifi className="h-4 w-4" />
                ) : iface.name.includes("eth") ? (
                  <Globe className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {iface.name}
                <Badge variant={iface.state === "up" ? "success" : "secondary"} className="ml-auto">
                  {iface.state}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAC</span>
                <span className="font-mono text-xs">{iface.mac ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">IPv4</span>
                <span className="font-mono text-xs">{iface.ipv4 ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">IPv6</span>
                <span className="font-mono text-xs truncate max-w-[200px]" title={iface.ipv6 ?? ""}>{iface.ipv6 ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {ifaces.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No interfaces found
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
