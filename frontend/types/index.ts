export interface Device {
  id: string
  status: "device" | "unauthorized" | "offline" | "unknown"
  model: string | null
  manufacturer: string | null
  market_name: string | null
  android_version: string | null
  sdk: number | null
  battery_level: number | null
  is_charging: boolean | null
}

export interface DeviceInfo {
  model: string
  manufacturer: string
  market_name: string
  board: string
  codename: string
  android_version: string
  sdk: number
  build_fingerprint: string
  security_patch: string
  kernel: string
  abis: string[]
  display_resolution: string
  display_density: number
  display_type: string
  bootloader_locked: boolean
  has_root: boolean
  locale: string
  timezone: string
  region: string
}

export interface SystemInfo {
  soc: string
  cpu: CpuInfo
  gpu: string
  kernel: string
  ram: MemoryInfo
  swap: MemoryInfo
}

export interface CpuInfo {
  architecture: string
  cores: number
  features: string[]
  bogo_mips: number
}

export interface MemoryInfo {
  total_kb: number
  used_kb: number
  free_kb: number
}

export interface StorageInfo {
  partitions: Partition[]
  app_size_bytes: number
  app_data_bytes: number
  cache_bytes: number
}

export interface Partition {
  mount: string
  fs: string
  total: string
  used: string
  avail: string
  usage_pct: number
}

export interface BatteryInfo {
  level: number
  status: string
  health: string
  voltage: number
  temperature: number
  technology: string
  is_charging: boolean
  charge_counter: number | null
  max_charging_current: number | null
  max_charging_voltage: number | null
  power_source: string
}

export interface NetworkInfo {
  sims: SimInfo[]
  network_type: string | null
  operator: string | null
  is_roaming: boolean
}

export interface SimInfo {
  slot: number
  state: "absent" | "loaded" | "unknown"
  operator: string | null
  country: string | null
  imei: string | null
}

export interface AppsInfo {
  total: number
  system: number
  user: number
  apps: AppEntry[]
}

export interface AppEntry {
  package_name: string
  is_system: boolean
  apk_path: string | null
}

export interface DeviceReport {
  generated_at: string
  device_id: string
  overview: DeviceInfo
  system: SystemInfo
  storage: StorageInfo
  battery: BatteryInfo
  network: NetworkInfo
  apps: AppsInfo
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}
