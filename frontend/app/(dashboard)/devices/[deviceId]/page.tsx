"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { DeviceInfo } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Smartphone, Cpu, HardDrive, Globe, Shield } from "lucide-react"
import { SensitiveField } from "@/components/ui/sensitive-field"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value ?? "—"}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function DeviceOverviewPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [info, setInfo] = useState<DeviceInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.info.get(deviceId).then(setInfo).catch((e) => setError(e.message))
  }, [deviceId])

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        {error}
      </div>
    )
  }

  if (!info) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading device info...
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SectionCard title="Device" icon={Smartphone}>
          <InfoRow label="Model" value={info.model} />
          <Separator />
          <InfoRow label="Manufacturer" value={info.manufacturer} />
          <Separator />
          <InfoRow label="Market Name" value={info.market_name} />
          <Separator />
          <InfoRow label="Codename" value={info.codename} />
          <Separator />
          <InfoRow label="Board" value={info.board} />
        </SectionCard>

        <SectionCard title="System" icon={Cpu}>
          <InfoRow label="Android" value={`${info.android_version} (SDK ${info.sdk})`} />
          <Separator />
          <InfoRow label="Security Patch" value={info.security_patch} />
          <Separator />
          <InfoRow label="Kernel" value={<span className="text-xs font-mono">{info.kernel}</span>} />
          <Separator />
          <InfoRow label="ABIs" value={info.abis.join(", ")} />
        </SectionCard>

        <SectionCard title="Display" icon={HardDrive}>
          <InfoRow label="Resolution" value={info.display_resolution} />
          <Separator />
          <InfoRow label="Density" value={`${info.display_density} dpi`} />
          <Separator />
          <InfoRow label="Type" value={info.display_type} />
        </SectionCard>

        <SectionCard title="Security" icon={Shield}>
          <InfoRow
            label="Bootloader"
            value={
              <Badge variant={info.bootloader_locked ? "success" : "destructive"}>
                {info.bootloader_locked ? "Locked" : "Unlocked"}
              </Badge>
            }
          />
          <Separator />
          <InfoRow
            label="Root"
            value={
              <Badge variant={info.has_root ? "destructive" : "success"}>
                {info.has_root ? "Rooted" : "No root"}
              </Badge>
            }
          />
          <Separator />
          <InfoRow label="Fingerprint" value={<SensitiveField value={info.build_fingerprint} className="text-xs font-mono" />} />
        </SectionCard>

        <SectionCard title="Locale" icon={Globe}>
          <InfoRow label="Locale" value={info.locale} />
          <Separator />
          <InfoRow label="Timezone" value={info.timezone} />
          <Separator />
          <InfoRow label="Region" value={info.region} />
        </SectionCard>

      </div>
    </ScrollArea>
  )
}
