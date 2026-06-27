"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { AppsInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Grid3X3, Search, Smartphone, FileCode } from "lucide-react"
import { SensitiveField } from "@/components/ui/sensitive-field"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  )
}

export default function AppsPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [apps, setApps] = useState<AppsInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

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
              {filteredApps.slice(0, 500).map((app) => (
                <div key={app.package_name} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <SensitiveField value={app.package_name} className="font-mono text-xs truncate" />
                  </div>
                  <Badge variant={app.is_system ? "secondary" : "outline"}>
                    {app.is_system ? "system" : "user"}
                  </Badge>
                </div>
              ))}
              {filteredApps.length > 500 && (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  Showing 500 of {filteredApps.length} packages
                </div>
              )}
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
