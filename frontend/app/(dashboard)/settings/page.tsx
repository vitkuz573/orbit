"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDeviceStore } from "@/store"
import { Separator } from "@/components/ui/separator"
import { Settings, RefreshCw, Bell, Globe } from "lucide-react"

export default function SettingsPage() {
  const { polling, startPolling, stopPolling } = useDeviceStore()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure Orbit behavior and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            Device Polling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Automatically refresh device list every 5 seconds.
          </p>
          <Button
            variant={polling ? "destructive" : "default"}
            size="sm"
            onClick={polling ? stopPolling : startPolling}
          >
            {polling ? "Stop Polling" : "Start Polling"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-muted-foreground" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Backend API URL</label>
            <Input
              defaultValue={process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}
              disabled
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Set via NEXT_PUBLIC_API_URL environment variable
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
