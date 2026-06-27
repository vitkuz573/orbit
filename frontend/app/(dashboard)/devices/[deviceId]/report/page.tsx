"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { DeviceReport } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Download, Printer, Smartphone, Cpu, HardDrive, Battery, Network, Grid3X3 } from "lucide-react"
import { SensitiveField } from "@/components/ui/sensitive-field"
import { formatBytes, formatKb, formatDate } from "@/lib/utils"

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {children}
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[70%] truncate">{value ?? "—"}</span>
    </div>
  )
}

export default function ReportPage() {
  const params = useParams()
  const deviceId = decodeURIComponent(params.deviceId as string)
  const [report, setReport] = useState<DeviceReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.report.get(deviceId)
      setReport(data)
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }

  const handlePrint = () => {
    const win = window.open("", "_blank")
    if (!win || !report) return
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>Device Report - ${report.device_id}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 900px; margin: auto; }
        h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        h2 { font-size: 1.1rem; margin-top: 1.5rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
        table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
        td, th { padding: 0.25rem 0.5rem; text-align: left; font-size: 0.875rem; }
        td:first-child { color: #666; width: 200px; }
        .meta { color: #666; font-size: 0.8rem; margin-bottom: 1rem; }
      </style></head><body>
      <h1>Orbit Device Report</h1>
      <div class="meta">Device: ${report.device_id} | Generated: ${formatDate(report.generated_at)}</div>
      ${Object.entries(report).filter(([k]) => k !== 'device_id' && k !== 'generated_at').map(([section, data]) => `
        <h2>${section.charAt(0).toUpperCase() + section.slice(1)}</h2>
        <table>${Object.entries(data as Record<string, unknown>).filter(([k]) => typeof (data as any)[k] !== 'object' || (data as any)[k] === null).map(([k, v]) => `<tr><td>${k}</td><td>${v ?? '—'}</td></tr>`).join('')}</table>
      `).join('')}
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={generate} disabled={loading}>
            <FileText className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Generate Full Report"}
          </Button>
          {report && (
            <>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print / PDF
              </Button>
            </>
          )}
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}

        {report && (
          <div ref={reportRef} className="space-y-6" id="report-content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Orbit Device Report
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <Row label="Device" value={<SensitiveField value={report.device_id} />} />
                <Row label="Generated" value={formatDate(report.generated_at)} />
                <Row label="Model" value={report.overview.market_name || report.overview.model} />
                <Row label="Android" value={`${report.overview.android_version} (SDK ${report.overview.sdk})`} />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Section title="System" icon={Cpu}>
                <Row label="SoC" value={report.system.soc} />
                <Row label="CPU" value={`${report.system.cpu.cores} cores`} />
                <Row label="GPU" value={report.system.gpu} />
                <Row label="RAM" value={formatKb(report.system.ram.total_kb)} />
                <Row label="Kernel" value={report.system.kernel.split(" ").slice(0, 3).join(" ")} />
              </Section>

              <Section title="Storage" icon={HardDrive}>
                <Row label="APK Size" value={formatBytes(report.storage.app_size_bytes)} />
                <Row label="Data Size" value={formatBytes(report.storage.app_data_bytes)} />
                <Row label="Cache Size" value={formatBytes(report.storage.cache_bytes)} />
                <Row label="Partitions" value={report.storage.partitions.length} />
              </Section>

              <Section title="Battery" icon={Battery}>
                <Row label="Level" value={`${report.battery.level}%`} />
                <Row label="Status" value={report.battery.status} />
                <Row label="Health" value={report.battery.health} />
                <Row label="Voltage" value={`${report.battery.voltage.toFixed(3)} V`} />
                <Row label="Temp" value={`${report.battery.temperature.toFixed(1)} °C`} />
              </Section>

              <Section title="Network" icon={Network}>
                <Row label="Operator" value={report.network.operator ?? "—"} />
                <Row label="Type" value={report.network.network_type ?? "—"} />
                <Row label="Roaming" value={report.network.is_roaming ? "Yes" : "No"} />
                <Row label="SIMs" value={report.network.sims.length} />
              </Section>

              <Section title="Apps" icon={Grid3X3}>
                <Row label="Total" value={report.apps.total} />
                <Row label="System" value={report.apps.system} />
                <Row label="User" value={report.apps.user} />
              </Section>

              <Section title="Security" icon={Smartphone}>
                <Row label="Bootloader" value={report.overview.bootloader_locked ? "Locked" : "Unlocked"} />
                <Row label="Root" value={report.overview.has_root ? "Yes" : "No"} />
                <Row label="Patch" value={report.overview.security_patch} />
              </Section>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
