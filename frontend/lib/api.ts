import type {
  ApiResponse,
  Device,
  DeviceInfo,
  SystemInfo,
  StorageInfo,
  BatteryInfo,
  NetworkInfo,
  AppsInfo,
  DeviceReport,
} from "@/types"

const API_BASE = "/api/v1"

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  const json: ApiResponse<T> = await res.json()
  if (!json.success || json.data === null) {
    throw new Error(json.error ?? "Unknown API error")
  }
  return json.data
}

function enc(s: string) { return encodeURIComponent(s) }

export const api = {
  devices: {
    list: () => fetchApi<Device[]>("/devices"),
    get: (id: string) => fetchApi<Device>(`/devices/${enc(id)}`),
  },
  info: {
    get: (id: string) => fetchApi<DeviceInfo>(`/devices/${enc(id)}/info`),
  },
  system: {
    get: (id: string) => fetchApi<SystemInfo>(`/devices/${enc(id)}/system`),
  },
  storage: {
    get: (id: string) => fetchApi<StorageInfo>(`/devices/${enc(id)}/storage`),
  },
  battery: {
    get: (id: string) => fetchApi<BatteryInfo>(`/devices/${enc(id)}/battery`),
  },
  network: {
    get: (id: string) => fetchApi<NetworkInfo>(`/devices/${enc(id)}/network`),
  },
  apps: {
    get: (id: string) => fetchApi<AppsInfo>(`/devices/${enc(id)}/apps`),
  },
  report: {
    get: (id: string) => fetchApi<DeviceReport>(`/devices/${enc(id)}/report`),
  },
  shell: async (id: string, command: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/devices/${enc(id)}/shell?command=${enc(command)}`, { method: "POST" })
    const json: ApiResponse<string> = await res.json()
    if (!json.success || json.data === null) {
      throw new Error(json.error ?? "Shell error")
    }
    return json.data
  },
}
