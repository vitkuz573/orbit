use serde::{Deserialize, Serialize};

// ─── Device ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub soc: String,
    pub cpu: CpuInfo,
    pub gpu: String,
    pub kernel: String,
    pub ram: MemoryInfo,
    pub swap: MemoryInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub architecture: String,
    pub cores: u32,
    pub features: Vec<String>,
    pub bogo_mips: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageInfo {
    pub partitions: Vec<Partition>,
    pub app_size_bytes: u64,
    pub app_data_bytes: u64,
    pub cache_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Partition {
    pub mount: String,
    pub fs: String,
    pub total: String,
    pub used: String,
    pub avail: String,
    pub usage_pct: u8,
}

// ─── Battery ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
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
}

// ─── Network ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub sims: Vec<SimInfo>,
    pub network_type: Option<String>,
    pub operator: Option<String>,
    pub is_roaming: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimInfo {
    pub slot: u32,
    pub state: SimState,
    pub operator: Option<String>,
    pub country: Option<String>,
    pub imei: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SimState {
    Absent,
    Loaded,
    Unknown,
}

// ─── Apps ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppsInfo {
    pub total: u32,
    pub system: u32,
    pub user: u32,
    pub apps: Vec<AppEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppEntry {
    pub package_name: String,
    pub is_system: bool,
    pub apk_path: Option<String>,
}

// ─── Report ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
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
