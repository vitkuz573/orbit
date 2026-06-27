"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { StorageInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatBytes } from "@/lib/utils"
import { HardDrive, Smartphone, Folder, Database } from "lucide-react"

export default function StoragePage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.storage.get(deviceId).then(setStorage).catch(setError)
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!storage) return <div className="text-muted-foreground">Loading...</div>

  const totalStorage = storage.app_size_bytes + storage.app_data_bytes + storage.cache_bytes

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6 md:grid-cols-2 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" /> Storage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">APK Size:</span>
                <span className="font-medium">{formatBytes(storage.app_size_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Data Size:</span>
                <span className="font-medium">{formatBytes(storage.app_data_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cache Size:</span>
                <span className="font-medium">{formatBytes(storage.cache_bytes)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" /> Partitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storage.partitions.map((p) => (
                <div key={p.mount} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono text-xs">{p.mount}</span>
                    <span className="text-muted-foreground text-xs">{p.total}</span>
                  </div>
                  <Progress value={p.usage_pct} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{p.fs}</span>
                    <span>{p.used} / {p.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
