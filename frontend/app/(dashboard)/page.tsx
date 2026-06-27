"use client"

import { useEffect } from "react"
import { useDeviceStore } from "@/store"
import { DeviceTable } from "@/components/dashboard/device-table"
import { StatsCards } from "@/components/dashboard/stats-cards"

export default function DashboardPage() {
  const devices = useDeviceStore((s) => s.devices)
  const loading = useDeviceStore((s) => s.loading)
  const error = useDeviceStore((s) => s.error)
  const fetchDevices = useDeviceStore((s) => s.fetchDevices)

  useEffect(() => {
    fetchDevices()
    const id = setInterval(fetchDevices, 3000)
    return () => clearInterval(id)
  }, [fetchDevices])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">Connection Error</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (loading && devices.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Scanning for devices...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StatsCards devices={devices} />
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Devices</h2>
        {devices.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground text-lg">No devices connected</p>
            <p className="text-muted-foreground text-sm mt-1">
              Connect an Android device via USB and enable USB debugging
            </p>
          </div>
        ) : (
          <DeviceTable devices={devices} />
        )}
      </div>
    </div>
  )
}
