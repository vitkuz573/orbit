"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { InputDevice } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mouse, Keyboard, Gamepad2, Touchpad } from "lucide-react"

function guessIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("touch") || n.includes("ft")) return Touchpad
  if (n.includes("key") || n.includes("button")) return Keyboard
  if (n.includes("game") || n.includes("joy")) return Gamepad2
  return Mouse
}

export default function InputPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [devices, setDevices] = useState<InputDevice[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.input.get(deviceId).then((d) => setDevices(d.devices)).catch((e) => setError(e.message))
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!devices) return <div className="text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6 md:grid-cols-2 min-w-0">
        {devices.map((d) => {
          const Icon = guessIcon(d.name)
          return (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {d.name}
                  <Badge variant="secondary" className="ml-auto">ID {d.id}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {d.handler && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Handler</span>
                      <span className="font-mono text-xs">{d.handler}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {d.phys && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phys</span>
                      <span className="font-mono text-xs truncate max-w-[250px]" title={d.phys}>{d.phys}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {d.sysfs && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sysfs</span>
                    <span className="font-mono text-xs truncate max-w-[250px]" title={d.sysfs}>{d.sysfs}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {devices.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No input devices found
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
