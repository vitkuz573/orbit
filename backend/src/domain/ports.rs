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
    async fn run_shell(&self, device_id: &str, command: &str) -> anyhow::Result<String>;
}
