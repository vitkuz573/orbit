import { create } from "zustand"
import type { Device } from "@/types"
import { api } from "@/lib/api"

interface DeviceStore {
  devices: Device[]
  selectedDeviceId: string | null
  loading: boolean
  error: string | null
  fetchDevices: () => Promise<void>
  selectDevice: (id: string | null) => void
  polling: boolean
  startPolling: () => void
  stopPolling: () => void
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  selectedDeviceId: null,
  loading: false,
  error: null,
  polling: false,

  fetchDevices: async () => {
    const hadDevices = get().devices.length > 0
    if (!hadDevices) set({ loading: true })
    set({ error: null })
    try {
      const devices = await api.devices.list()
      set({ devices, loading: false })
    } catch (e) {
      if (!hadDevices) set({ error: (e as Error).message })
      set({ loading: false })
    }
  },

  selectDevice: (id) => set({ selectedDeviceId: id }),

  startPolling: () => {
    if (get().polling) return
    set({ polling: true })
    const interval = setInterval(() => {
      get().fetchDevices()
    }, 5000)
    // Store interval for cleanup
    ;(window as any).__orbit_polling = interval
  },

  stopPolling: () => {
    set({ polling: false })
    const interval = (window as any).__orbit_polling
    if (interval) {
      clearInterval(interval)
      delete (window as any).__orbit_polling
    }
  },
}))
