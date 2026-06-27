"use client"

import { useEffect } from "react"
import { useDeviceStore } from "@/store"
import { DeviceTable } from "@/components/dashboard/device-table"

export default function DevicesPage() {
  const devices = useDeviceStore((s) => s.devices)
  const loading = useDeviceStore((s) => s.loading)
  const fetchDevices = useDeviceStore((s) => s.fetchDevices)

  useEffect(() => {
    fetchDevices()
    const id = setInterval(fetchDevices, 3000)
    return () => clearInterval(id)
  }, [fetchDevices])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Devices</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All connected and detected Android devices
        </p>
      </div>

      {loading && devices.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Scanning for devices...
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-lg">No devices detected</p>
          <p className="text-muted-foreground text-sm mt-1">
            Connect an Android device via USB with USB debugging enabled
          </p>
        </div>
      ) : (
        <DeviceTable devices={devices} />
      )}
    </div>
  )
}
