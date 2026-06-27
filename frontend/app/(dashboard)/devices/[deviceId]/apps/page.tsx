"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { AppsInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Grid3X3, Search, Smartphone, FileCode, Bug, Calendar, HardDrive, Shield } from "lucide-react"
import { SensitiveField } from "@/components/ui/sensitive-field"
import { Separator } from "@/components/ui/separator"

export default function AppsPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [apps, setApps] = useState<AppsInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    api.apps.get(deviceId).then(setApps).catch(setError)
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!apps) return <div className="text-muted-foreground">Loading...</div>

  const filteredApps = apps.apps.filter((a) =>
    a.package_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" /> Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apps.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apps.system}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileCode className="h-4 w-4" /> User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apps.user}</div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredApps.map((app) => (
                <div key={app.package_name}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-accent/50 text-left cursor-pointer"
                    onClick={() => setExpanded(expanded === app.package_name ? null : app.package_name)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(expanded === app.package_name ? null : app.package_name) } }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <SensitiveField value={app.package_name} className="font-mono text-xs truncate" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {app.debuggable && (
                        <Bug className="h-3 w-3 text-destructive" />
                      )}
                      <Badge variant={app.is_system ? "secondary" : "outline"}>
                        {app.is_system ? "system" : "user"}
                      </Badge>
                    </div>
                  </div>
                  {expanded === app.package_name && (
                    <div className="px-4 pb-3 pt-0 text-sm bg-muted/30">
                      <Separator className="mb-2" />
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="text-muted-foreground">Version</div>
                        <div className="font-mono text-xs">{app.version_name ?? "—"} ({app.version_code ?? "—"})</div>

                        <div className="text-muted-foreground">Target SDK</div>
                        <div>{app.target_sdk ?? "—"}</div>

                        <div className="text-muted-foreground">UID</div>
                        <div className="font-mono text-xs">{app.uid ?? "—"}</div>

                        <div className="text-muted-foreground">Installer</div>
                        <div className="font-mono text-xs truncate">{app.installer ?? "—"}</div>

                        <div className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Installed
                        </div>
                        <div className="text-xs">{app.first_install_time ?? "—"}</div>

                        <div className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Updated
                        </div>
                        <div className="text-xs">{app.last_update_time ?? "—"}</div>

                        {app.data_dir && (
                          <>
                            <div className="text-muted-foreground flex items-center gap-1">
                              <HardDrive className="h-3 w-3" /> Data Dir
                            </div>
                            <div className="font-mono text-xs truncate">{app.data_dir}</div>
                          </>
                        )}

                        {app.apk_path && (
                          <>
                            <div className="text-muted-foreground">APK</div>
                            <div className="font-mono text-xs truncate">{app.apk_path}</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredApps.length === 0 && (
                <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                  No packages match "{search}"
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
