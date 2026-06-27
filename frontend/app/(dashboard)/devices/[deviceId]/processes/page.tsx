"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { ProcessEntry } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Search } from "lucide-react"

export default function ProcessesPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [data, setData] = useState<{ total: number; processes: ProcessEntry[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api.processes.get(deviceId).then(setData).catch((e) => setError(e.message))
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!data) return <div className="text-muted-foreground">Loading...</div>

  const filtered = data.processes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user.toLowerCase().includes(search.toLowerCase()) ||
      String(p.pid).includes(search)
  )

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Running Processes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
            <p className="text-xs text-muted-foreground">total processes</p>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, user, or PID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left px-4 py-2 font-medium">PID</th>
                    <th className="text-left px-4 py-2 font-medium">PPID</th>
                    <th className="text-right px-4 py-2 font-medium">CPU%</th>
                    <th className="text-right px-4 py-2 font-medium">MEM%</th>
                    <th className="text-right px-4 py-2 font-medium">RSS</th>
                    <th className="text-right px-4 py-2 font-medium">VSZ</th>
                    <th className="text-left px-4 py-2 font-medium">User</th>
                    <th className="text-left px-4 py-2 font-medium">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.pid} className="border-b last:border-0 hover:bg-accent/50 font-mono text-xs">
                      <td className="px-4 py-1.5">{p.pid}</td>
                      <td className="px-4 py-1.5 text-muted-foreground">{p.ppid}</td>
                      <td className="px-4 py-1.5 text-right">{p.cpu_pct.toFixed(1)}</td>
                      <td className="px-4 py-1.5 text-right">{p.mem_pct.toFixed(1)}</td>
                      <td className="px-4 py-1.5 text-right">{(p.rss_kb / 1024).toFixed(0)}M</td>
                      <td className="px-4 py-1.5 text-right">{(p.vsz_kb / 1024).toFixed(0)}M</td>
                      <td className="px-4 py-1.5">{p.user}</td>
                      <td className="px-4 py-1.5 max-w-[300px] truncate" title={p.name}>{p.name}</td>
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
