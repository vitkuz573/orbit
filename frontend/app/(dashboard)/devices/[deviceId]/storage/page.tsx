"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { StorageInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatBytes } from "@/lib/utils"
import { HardDrive, Smartphone, Folder, Database, Shield, Gauge, Cpu, Film, Music, Download, Archive, Search, ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function StoragePage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [appFilter, setAppFilter] = useState("")

  useEffect(() => {
    api.storage.get(deviceId).then(setStorage).catch(setError)
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!storage) return <div className="text-muted-foreground">Loading...</div>

  const filteredApps = storage.app_storage.filter(a =>
    a.package_name.toLowerCase().includes(appFilter.toLowerCase())
  )

  const iconClass = "h-4 w-4 text-muted-foreground"

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-6">
        {/* Row 1: Data partition + App/Cache summary */}
        <div className="grid gap-6 md:grid-cols-2 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4" /> Data Partition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {storage.data_total_bytes > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className={iconClass} />
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{formatBytes(storage.data_total_bytes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className={iconClass} />
                    <span className="text-muted-foreground">Used:</span>
                    <span className="font-medium">{formatBytes(storage.data_used_bytes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Folder className={iconClass} />
                    <span className="text-muted-foreground">Free:</span>
                    <span className="font-medium">{formatBytes(storage.data_free_bytes)}</span>
                  </div>
                  <Progress value={storage.data_free_pct} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {storage.data_free_pct}% free
                  </div>
                </>
              )}
              {storage.filesystem && (
                <div className="flex items-center gap-2 text-sm pt-2">
                  <Cpu className={iconClass} />
                  <span className="text-muted-foreground">Filesystem:</span>
                  <span className="font-mono text-xs">{storage.filesystem}</span>
                  {storage.block_size && (
                    <span className="text-muted-foreground">({formatBytes(storage.block_size)} blocks)</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Shield className={iconClass} />
                <span className="text-muted-foreground">FBE:</span>
                <span className={storage.file_based_encryption ? "text-green-500" : "text-muted-foreground"}>
                  {storage.file_based_encryption ? "Enabled" : "Disabled"}
                </span>
              </div>
              {storage.disk_write_speed_kbps != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className={iconClass} />
                  <span className="text-muted-foreground">Disk Write Speed:</span>
                  <span className="font-medium">{storage.disk_write_speed_kbps} kB/s</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Archive className="h-4 w-4" /> App & Media Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className={iconClass} />
                <span className="text-muted-foreground">APK Size:</span>
                <span className="font-medium">{formatBytes(storage.app_size_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Database className={iconClass} />
                <span className="text-muted-foreground">App Data:</span>
                <span className="font-medium">{formatBytes(storage.app_data_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Folder className={iconClass} />
                <span className="text-muted-foreground">App Cache:</span>
                <span className="font-medium">{formatBytes(storage.cache_bytes)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex items-center gap-2 text-sm">
                <Film className={iconClass} />
                <span className="text-muted-foreground">Videos:</span>
                <span className="font-medium">{formatBytes(storage.videos_size_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className={iconClass} />
                <span className="text-muted-foreground">Photos:</span>
                <span className="font-medium">{formatBytes(storage.photos_size_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Music className={iconClass} />
                <span className="text-muted-foreground">Audio:</span>
                <span className="font-medium">{formatBytes(storage.audio_size_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Download className={iconClass} />
                <span className="text-muted-foreground">Downloads:</span>
                <span className="font-medium">{formatBytes(storage.downloads_size_bytes)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: System/Other + Cache/Metadata */}
        <div className="grid gap-6 md:grid-cols-2 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-4 w-4" /> System & Other
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-24">System:</span>
                <span className="font-medium">{formatBytes(storage.system_size_bytes)}</span>
              </div>
              {storage.system_total_bytes > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-24">System Partition:</span>
                  <span className="font-medium">{formatBytes(storage.system_total_bytes)}</span>
                  <span className="text-muted-foreground">({formatBytes(storage.system_free_bytes)} free)</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-24">Other:</span>
                <span className="font-medium">{formatBytes(storage.other_size_bytes)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" /> Cache & Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {storage.cache_total_bytes > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-24">Cache Total:</span>
                    <span className="font-medium">{formatBytes(storage.cache_total_bytes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-24">Cache Free:</span>
                    <span className="font-medium">{formatBytes(storage.cache_free_bytes)}</span>
                  </div>
                </>
              )}
              {storage.metadata_total_bytes > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-24">Metadata Total:</span>
                    <span className="font-medium">{formatBytes(storage.metadata_total_bytes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-24">Metadata Free:</span>
                    <span className="font-medium">{formatBytes(storage.metadata_free_bytes)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Partitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" /> Partitions ({storage.partitions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {storage.partitions.map((p) => (
                <div key={p.mount} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono text-xs truncate">{p.mount}</span>
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

        {/* Per-App Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" /> App Storage ({storage.app_storage.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Filter by package name..."
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="max-w-sm"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Package</th>
                    <th className="pb-2 pr-4 font-medium text-right">APK</th>
                    <th className="pb-2 pr-4 font-medium text-right">Data</th>
                    <th className="pb-2 font-medium text-right">Cache</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.slice(0, 200).map((a) => (
                    <tr key={a.package_name} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 font-mono text-xs max-w-[300px] truncate">{a.package_name}</td>
                      <td className="py-2 pr-4 text-right text-xs">{formatBytes(a.app_size_bytes)}</td>
                      <td className="py-2 pr-4 text-right text-xs">{formatBytes(a.data_size_bytes)}</td>
                      <td className="py-2 text-right text-xs">{formatBytes(a.cache_size_bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
