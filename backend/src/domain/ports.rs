use crate::domain::models::*;
use async_trait::async_trait;

#[async_trait]
pub trait AdbPort: Send + Sync {
    async fn list_devices(&self) -> anyhow::Result<Vec<Device>>;
    async fn get_device_info(&self, device_id: &str) -> anyhow::Result<DeviceInfo>;
    async fn get_system_info(&self, device_id: &str) -> anyhow::Result<SystemInfo>;
    async fn get_storage_info(&self, device_id: &str) -> anyhow::Result<StorageInfo>;
    async fn get_battery_info(&self, device_id: &str) -> anyhow::Result<BatteryInfo>;
    async fn get_network_info(&self, device_id: &str) -> anyhow::Result<NetworkInfo>;
    async fn get_apps_info(&self, device_id: &str) -> anyhow::Result<AppsInfo>;
    async fn get_processes(&self, device_id: &str) -> anyhow::Result<ProcessesInfo>;
    async fn get_sensors(&self, device_id: &str) -> anyhow::Result<SensorsInfo>;
    async fn get_thermal(&self, device_id: &str) -> anyhow::Result<ThermalInfo>;
    async fn get_connectivity(&self, device_id: &str) -> anyhow::Result<ConnectivityInfo>;
    async fn get_input(&self, device_id: &str) -> anyhow::Result<InputInfo>;
    async fn get_location(&self, device_id: &str) -> anyhow::Result<LocationInfo>;
    async fn run_shell(&self, device_id: &str, command: &str) -> anyhow::Result<String>;
}
