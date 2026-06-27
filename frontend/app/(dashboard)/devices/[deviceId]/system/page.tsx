"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { SystemInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatKb } from "@/lib/utils"
import { Cpu, Zap, MemoryStick, Activity } from "lucide-react"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value ?? "—"}</span>
    </div>
  )
}

function MemoryBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatKb(used)} / {formatKb(total)}</span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground">{pct}% used</p>
    </div>
  )
}

export default function SystemPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [sys, setSys] = useState<SystemInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.system.get(deviceId).then(setSys).catch(setError)
  }, [deviceId])

  if (error) return <div className="text-destructive">{error}</div>
  if (!sys) return <div className="text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4" /> SoC & CPU
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="SoC" value={sys.soc} />
            <Separator />
            <InfoRow label="Architecture" value={sys.cpu.architecture} />
            <Separator />
            <InfoRow label="Cores" value={sys.cpu.cores} />
            <Separator />
            <InfoRow label="BogoMIPS" value={sys.cpu.bogo_mips.toFixed(2)} />
            <Separator />
            <InfoRow label="Features" value={sys.cpu.features.slice(0, 8).join(" ")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" /> GPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="GPU" value={sys.gpu} />
            <Separator />
            <InfoRow label="Kernel" value={<span className="text-xs font-mono">{sys.kernel}</span>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MemoryStick className="h-4 w-4" /> RAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemoryBar label="Memory" used={sys.ram.used_kb} total={sys.ram.total_kb} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Swap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemoryBar label="Swap" used={sys.swap.used_kb} total={sys.swap.total_kb} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
