use std::sync::Arc;

use chrono::Utc;
use tokio::try_join;

use crate::domain::models::*;
use crate::domain::AdbPort;

pub struct ReportService {
    adb: Arc<dyn AdbPort>,
}

impl ReportService {
    pub fn new(adb: Arc<dyn AdbPort>) -> Self {
        Self { adb }
    }

    pub async fn generate_report(&self, device_id: &str) -> anyhow::Result<DeviceReport> {
        let info = self.adb.get_device_info(device_id);
        let system = self.adb.get_system_info(device_id);
        let storage = self.adb.get_storage_info(device_id);
        let battery = self.adb.get_battery_info(device_id);
        let network = self.adb.get_network_info(device_id);
        let apps = self.adb.get_apps_info(device_id);

        let (overview, system, storage, battery, network, apps) = try_join!(
            info, system, storage, battery, network, apps
        )?;

        Ok(DeviceReport {
            generated_at: Utc::now().to_rfc3339(),
            device_id: device_id.to_string(),
            overview,
            system,
            storage,
            battery,
            network,
            apps,
        })
    }
}
