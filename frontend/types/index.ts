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
  is_fast_charge: boolean
  charging_protocol: string | null
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

// ─── Processes ──────────────────────────────────────────────────────────────

export interface ProcessesInfo {
  total: number
  processes: ProcessEntry[]
}

export interface ProcessEntry {
  pid: number
  ppid: number
  cpu_pct: number
  mem_pct: number
  rss_kb: number
  vsz_kb: number
  user: string
  name: string
}

// ─── Sensors ────────────────────────────────────────────────────────────────

export interface SensorsInfo {
  sensors: SensorEntry[]
}

export interface SensorEntry {
  name: string
  vendor: string
  type: string
  value: number
  power_ma: number
}

// ─── Thermal ────────────────────────────────────────────────────────────────

export interface ThermalInfo {
  zones: ThermalZone[]
}

export interface ThermalZone {
  name: string
  temp_c: number
}

// ─── Connectivity ───────────────────────────────────────────────────────────

export interface ConnectivityInfo {
  interfaces: InterfaceInfo[]
}

export interface InterfaceInfo {
  name: string
  state: string
  ipv4: string | null
  ipv6: string | null
  mac: string | null
}

// ─── Input ──────────────────────────────────────────────────────────────────

export interface InputInfo {
  devices: InputDevice[]
}

export interface InputDevice {
  name: string
  id: number
  phys: string | null
  sysfs: string | null
  handler: string | null
}

// ─── Location ───────────────────────────────────────────────────────────────

export interface LocationInfo {
  providers: LocationProvider[]
  is_gps_enabled: boolean
  is_network_enabled: boolean
  location_enabled: boolean
  gps_started: boolean | null
  gps_fix_interval: number | null
}

export interface LocationProvider {
  name: string
  enabled: boolean
  status: string | null
  last_latitude: number | null
  last_longitude: number | null
  last_altitude: number | null
  last_accuracy: number | null
  last_vertical_accuracy: number | null
  power_usage: string | null
  accuracy_type: string | null
  requires: string[] | null
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}
