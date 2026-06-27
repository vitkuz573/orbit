use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

// ─── Device ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Device {
    pub id: String,
    pub status: DeviceStatus,
    pub model: Option<String>,
    pub manufacturer: Option<String>,
    pub market_name: Option<String>,
    pub android_version: Option<String>,
    pub sdk: Option<u32>,
    pub battery_level: Option<u32>,
    pub is_charging: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum DeviceStatus {
    Device,
    Unauthorized,
    Offline,
    Unknown,
}

impl From<&str> for DeviceStatus {
    fn from(s: &str) -> Self {
        match s {
            "device" => Self::Device,
            "unauthorized" => Self::Unauthorized,
            "offline" => Self::Offline,
            _ => Self::Unknown,
        }
    }
}

// ─── Device Info ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct DeviceInfo {
    pub model: String,
    pub manufacturer: String,
    pub market_name: String,
    pub board: String,
    pub codename: String,
    pub android_version: String,
    pub sdk: u32,
    pub build_fingerprint: String,
    pub security_patch: String,
    pub kernel: String,
    pub abis: Vec<String>,
    pub display_resolution: String,
    pub display_density: u32,
    pub display_type: String,
    pub bootloader_locked: bool,
    pub has_root: bool,
    pub locale: String,
    pub timezone: String,
    pub region: String,
}

// ─── System ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SystemInfo {
    pub soc: String,
    pub cpu: CpuInfo,
    pub gpu: String,
    pub kernel: String,
    pub ram: MemoryInfo,
    pub swap: MemoryInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CpuInfo {
    pub architecture: String,
    pub cores: u32,
    pub features: Vec<String>,
    pub bogo_mips: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MemoryInfo {
    pub total_kb: u64,
    pub used_kb: u64,
    pub free_kb: u64,
}

impl MemoryInfo {
    pub fn usage_percent(&self) -> f64 {
        if self.total_kb == 0 {
            return 0.0;
        }
        (self.used_kb as f64 / self.total_kb as f64) * 100.0
    }
}

// ─── Storage ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct StorageInfo {
    pub partitions: Vec<Partition>,
    pub app_size_bytes: u64,
    pub app_data_bytes: u64,
    pub cache_bytes: u64,
    pub data_total_bytes: u64,
    pub data_free_bytes: u64,
    pub data_used_bytes: u64,
    pub data_free_pct: u64,
    pub cache_total_bytes: u64,
    pub cache_free_bytes: u64,
    pub system_total_bytes: u64,
    pub system_free_bytes: u64,
    pub metadata_total_bytes: u64,
    pub metadata_free_bytes: u64,
    pub file_based_encryption: bool,
    pub photos_size_bytes: u64,
    pub videos_size_bytes: u64,
    pub audio_size_bytes: u64,
    pub downloads_size_bytes: u64,
    pub system_size_bytes: u64,
    pub other_size_bytes: u64,
    pub disk_write_speed_kbps: Option<u64>,
    pub filesystem: Option<String>,
    pub block_size: Option<u64>,
    pub app_storage: Vec<AppStorageEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AppStorageEntry {
    pub package_name: String,
    pub app_size_bytes: u64,
    pub data_size_bytes: u64,
    pub cache_size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Partition {
    pub mount: String,
    pub fs: String,
    pub total: String,
    pub used: String,
    pub avail: String,
    pub usage_pct: u8,
}

// ─── Battery ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BatteryInfo {
    pub level: u32,
    pub status: String,
    pub health: String,
    pub voltage: f64,
    pub temperature: f64,
    pub technology: String,
    pub is_charging: bool,
    pub charge_counter: Option<u32>,
    pub max_charging_current: Option<u32>,
    pub max_charging_voltage: Option<u32>,
    pub power_source: String,
    pub is_fast_charge: bool,
    pub charging_protocol: Option<String>,
}

// ─── Network ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct NetworkInfo {
    pub sims: Vec<SimInfo>,
    pub network_type: Option<String>,
    pub operator: Option<String>,
    pub is_roaming: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SimInfo {
    pub slot: u32,
    pub state: SimState,
    pub operator: Option<String>,
    pub country: Option<String>,
    pub imei: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum SimState {
    Absent,
    Loaded,
    Unknown,
}

// ─── Apps ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AppsInfo {
    pub total: u32,
    pub system: u32,
    pub user: u32,
    pub apps: Vec<AppEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AppEntry {
    pub package_name: String,
    pub is_system: bool,
    pub apk_path: Option<String>,
    pub uid: Option<u32>,
    pub version_code: Option<u64>,
    pub version_name: Option<String>,
    pub target_sdk: Option<u32>,
    pub data_dir: Option<String>,
    pub first_install_time: Option<String>,
    pub last_update_time: Option<String>,
    pub installer: Option<String>,
    pub debuggable: Option<bool>,
}

// ─── Processes ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ProcessesInfo {
    pub total: u32,
    pub processes: Vec<ProcessEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ProcessEntry {
    pub pid: u32,
    pub ppid: u32,
    pub cpu_pct: f32,
    pub mem_pct: f32,
    pub rss_kb: u64,
    pub vsz_kb: u64,
    pub user: String,
    pub name: String,
}

// ─── Sensors ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SensorsInfo {
    pub sensors: Vec<SensorEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SensorEntry {
    pub name: String,
    pub vendor: String,
    #[serde(rename = "type")]
    pub sensor_type: String,
    pub value: f64,
    pub power_ma: f64,
}

// ─── Thermal ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ThermalInfo {
    pub zones: Vec<ThermalZone>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ThermalZone {
    pub name: String,
    pub temp_c: f64,
}

// ─── Connectivity ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ConnectivityInfo {
    pub interfaces: Vec<InterfaceInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct InterfaceInfo {
    pub name: String,
    pub state: String,
    pub ipv4: Option<String>,
    pub ipv6: Option<String>,
    pub mac: Option<String>,
}

// ─── Input ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct InputInfo {
    pub devices: Vec<InputDevice>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct InputDevice {
    pub name: String,
    pub id: u32,
    pub phys: Option<String>,
    pub sysfs: Option<String>,
    pub handler: Option<String>,
}

// ─── Location ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct LocationInfo {
    pub providers: Vec<LocationProvider>,
    pub is_gps_enabled: bool,
    pub is_network_enabled: bool,
    pub location_enabled: bool,
    pub gps_started: Option<bool>,
    pub gps_fix_interval: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct LocationProvider {
    pub name: String,
    pub enabled: bool,
    pub status: Option<String>,
    pub last_latitude: Option<f64>,
    pub last_longitude: Option<f64>,
    pub last_altitude: Option<f64>,
    pub last_accuracy: Option<f64>,
    pub last_vertical_accuracy: Option<f64>,
    pub power_usage: Option<String>,
    pub accuracy_type: Option<String>,
    pub requires: Option<Vec<String>>,
}

// ─── Report ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct DeviceReport {
    pub generated_at: String,
    pub device_id: String,
    pub overview: DeviceInfo,
    pub system: SystemInfo,
    pub storage: StorageInfo,
    pub battery: BatteryInfo,
    pub network: NetworkInfo,
    pub apps: AppsInfo,
}
