use std::sync::Arc;

use tracing::info;

use crate::domain::models::*;
use crate::domain::AdbPort;

pub struct DeviceService {
    adb: Arc<dyn AdbPort>,
}

impl DeviceService {
    pub fn new(adb: Arc<dyn AdbPort>) -> Self {
        Self { adb }
    }

    pub async fn list_devices(&self) -> anyhow::Result<Vec<Device>> {
        info!("DeviceService::list_devices");
        self.adb.list_devices().await
    }

    pub async fn get_device(&self, device_id: &str) -> anyhow::Result<Device> {
        info!("DeviceService::get_device: {}", device_id);
        let devices = self.adb.list_devices().await?;
        devices
            .into_iter()
            .find(|d| d.id == device_id)
            .ok_or_else(|| anyhow::anyhow!("device not found: {}", device_id))
    }

    pub async fn get_info(&self, device_id: &str) -> anyhow::Result<DeviceInfo> {
        info!("DeviceService::get_info: {}", device_id);
        self.adb.get_device_info(device_id).await
    }

    pub async fn get_system(&self, device_id: &str) -> anyhow::Result<SystemInfo> {
        info!("DeviceService::get_system: {}", device_id);
        self.adb.get_system_info(device_id).await
    }

    pub async fn get_storage(&self, device_id: &str) -> anyhow::Result<StorageInfo> {
        info!("DeviceService::get_storage: {}", device_id);
        self.adb.get_storage_info(device_id).await
    }

    pub async fn get_battery(&self, device_id: &str) -> anyhow::Result<BatteryInfo> {
        info!("DeviceService::get_battery: {}", device_id);
        self.adb.get_battery_info(device_id).await
    }

    pub async fn get_network(&self, device_id: &str) -> anyhow::Result<NetworkInfo> {
        info!("DeviceService::get_network: {}", device_id);
        self.adb.get_network_info(device_id).await
    }

    pub async fn get_apps(&self, device_id: &str) -> anyhow::Result<AppsInfo> {
        info!("DeviceService::get_apps: {}", device_id);
        self.adb.get_apps_info(device_id).await
    }

    pub async fn get_processes(&self, device_id: &str) -> anyhow::Result<ProcessesInfo> {
        info!("DeviceService::get_processes: {}", device_id);
        self.adb.get_processes(device_id).await
    }

    pub async fn get_sensors(&self, device_id: &str) -> anyhow::Result<SensorsInfo> {
        info!("DeviceService::get_sensors: {}", device_id);
        self.adb.get_sensors(device_id).await
    }

    pub async fn get_thermal(&self, device_id: &str) -> anyhow::Result<ThermalInfo> {
        info!("DeviceService::get_thermal: {}", device_id);
        self.adb.get_thermal(device_id).await
    }

    pub async fn get_connectivity(&self, device_id: &str) -> anyhow::Result<ConnectivityInfo> {
        info!("DeviceService::get_connectivity: {}", device_id);
        self.adb.get_connectivity(device_id).await
    }

    pub async fn get_input(&self, device_id: &str) -> anyhow::Result<InputInfo> {
        info!("DeviceService::get_input: {}", device_id);
        self.adb.get_input(device_id).await
    }

    pub async fn get_location(&self, device_id: &str) -> anyhow::Result<LocationInfo> {
        info!("DeviceService::get_location: {}", device_id);
        self.adb.get_location(device_id).await
    }

    pub async fn shell(&self, device_id: &str, command: &str) -> anyhow::Result<String> {
        info!("DeviceService::shell: {} $ {}", device_id, command);
        self.adb.run_shell(device_id, command).await
    }
}
