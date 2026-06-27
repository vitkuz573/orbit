use std::process::Stdio;

use async_trait::async_trait;
use tokio::process::Command;
use tracing::{debug, error, info};

use super::adb_commands::{self as cmd, AdbCommand};
use super::adb_parser;
use crate::domain::models::*;
use crate::domain::AdbPort;

#[derive(Debug, Clone)]
pub struct AdbExecutor {
    adb_path: String,
}

impl AdbExecutor {
    pub fn new(adb_path: String) -> Self {
        Self { adb_path }
    }

    async fn execute(&self, command: &AdbCommand) -> anyhow::Result<String> {
        let args: Vec<&str> = command.to_vec();
        debug!("executing: {}", command);

        let output = Command::new(&self.adb_path)
            .args(&args[1..]) // skip "adb" since we use the path directly
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| anyhow::anyhow!("failed to execute adb: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            error!("adb command failed: {}\nstderr: {}", command, stderr);
            return Err(anyhow::anyhow!("adb error: {}", stderr.trim()));
        }

        Ok(stdout)
    }
}

async fn getprop_val(exec: &AdbExecutor, device: &str, key: &str) -> Option<String> {
    exec.execute(&cmd::shell(device, &format!("getprop {}", key)))
        .await
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

#[async_trait]
impl AdbPort for AdbExecutor {
    async fn list_devices(&self) -> anyhow::Result<Vec<Device>> {
        info!("listing devices");
        let output = self.execute(&cmd::devices()).await?;
        let mut devices = adb_parser::parse_devices(&output);

        // Enrich each device with model/manufacturer info
        for device in &mut devices {
            let id = &device.id;
            device.model = getprop_val(self, id, "ro.product.model").await;
            device.manufacturer = getprop_val(self, id, "ro.product.manufacturer").await;
            device.market_name = getprop_val(self, id, "ro.product.marketname").await;
            device.android_version = getprop_val(self, id, "ro.build.version.release").await;
            device.sdk = getprop_val(self, id, "ro.build.version.sdk")
                .await
                .and_then(|v| v.parse().ok());

            // Get battery info
            if let Ok(bat) = self.execute(&cmd::dumpsys_battery(id)).await {
                let bi = adb_parser::parse_battery(&bat);
                device.battery_level = Some(bi.level);
                device.is_charging = Some(bi.is_charging);
            }
        }

        Ok(devices)
    }

    async fn get_device_info(&self, device_id: &str) -> anyhow::Result<DeviceInfo> {
        let props = self.execute(&cmd::getprop_all(device_id)).await?;

        let find = |key: &str| adb_parser::parse_getprop(&props, key);

        let size_output = self.execute(&cmd::wm_size(device_id)).await.unwrap_or_default();
        let density_output = self.execute(&cmd::wm_density(device_id)).await.unwrap_or_default();
        let kernel = self.execute(&cmd::proc_version(device_id)).await.unwrap_or_default();

        let abis_raw = find("ro.product.cpu.abilist")
            .unwrap_or_default();
        let abis: Vec<String> = abis_raw.split(',').map(|s| s.trim().to_string()).collect();

        let display_type = find("ro.vendor.display.type").unwrap_or_default();

        let boot_locked = find("ro.boot.vbmeta.device_state")
            .map(|v| v == "locked")
            .unwrap_or(true);

        let has_root = find("ro.debuggable")
            .map(|v| v == "1")
            .unwrap_or(false);

        Ok(DeviceInfo {
            model: find("ro.product.model").unwrap_or_default(),
            manufacturer: find("ro.product.manufacturer").unwrap_or_default(),
            market_name: find("ro.product.marketname").unwrap_or_default(),
            board: find("ro.product.board").unwrap_or_default(),
            codename: find("ro.product.device").unwrap_or_default(),
            android_version: find("ro.build.version.release").unwrap_or_default(),
            sdk: find("ro.build.version.sdk")
                .and_then(|v| v.parse().ok())
                .unwrap_or(0),
            build_fingerprint: find("ro.build.fingerprint").unwrap_or_default(),
            security_patch: find("ro.build.version.security_patch").unwrap_or_default(),
            kernel: kernel.lines().next().unwrap_or("unknown").to_string(),
            abis,
            display_resolution: adb_parser::parse_display_size(&size_output).unwrap_or_default(),
            display_density: adb_parser::parse_display_density(&density_output).unwrap_or(0),
            display_type,
            bootloader_locked: boot_locked,
            has_root,
            locale: find("persist.sys.locale").unwrap_or_default(),
            timezone: find("persist.sys.timezone").unwrap_or_default(),
            region: find("ro.miui.region").unwrap_or_default(),
        })
    }

    async fn get_system_info(&self, device_id: &str) -> anyhow::Result<SystemInfo> {
        let cpu_output = self.execute(&cmd::cpuinfo(device_id)).await?;
        let mem_output = self.execute(&cmd::meminfo(device_id)).await?;
        let uname_output = self.execute(&cmd::uname(device_id)).await?;

        let soc = match getprop_val(self, device_id, "ro.soc.model").await {
            Some(v) if !v.is_empty() => v,
            _ => getprop_val(self, device_id, "ro.board.platform").await
                .filter(|v| !v.is_empty())
                .unwrap_or_else(|| "unknown".to_string()),
        };
        let gpu = getprop_val(self, device_id, "ro.hardware.egl").await
            .filter(|v| !v.is_empty())
            .unwrap_or_else(|| "unknown".to_string());

        let cpu = adb_parser::parse_cpu_info(&cpu_output);
        let (ram, swap) = adb_parser::parse_meminfo(&mem_output);

        Ok(SystemInfo {
            soc,
            cpu,
            gpu,
            kernel: uname_output.trim().to_string(),
            ram,
            swap,
        })
    }

    async fn get_storage_info(&self, device_id: &str) -> anyhow::Result<StorageInfo> {
        let df_output = self.execute(&cmd::disk_usage(device_id)).await?;
        let diskstats = self
            .execute(&cmd::shell(device_id, "dumpsys diskstats"))
            .await
            .unwrap_or_default();

        let combined = format!("{}\n{}", df_output, diskstats);
        let (partitions, app, data, cache) = adb_parser::parse_disk_usage(&combined);

        Ok(StorageInfo {
            partitions,
            app_size_bytes: app,
            app_data_bytes: data,
            cache_bytes: cache,
        })
    }

    async fn get_battery_info(&self, device_id: &str) -> anyhow::Result<BatteryInfo> {
        let output = self.execute(&cmd::dumpsys_battery(device_id)).await?;
        Ok(adb_parser::parse_battery(&output))
    }

    async fn get_network_info(&self, device_id: &str) -> anyhow::Result<NetworkInfo> {
        let tele = self
            .execute(&cmd::dumpsys_telephony(device_id))
            .await
            .unwrap_or_default();

        let raw_state = getprop_val(self, device_id, "gsm.sim.state").await.unwrap_or_default();
        let raw_op = getprop_val(self, device_id, "gsm.sim.operator.alpha").await.unwrap_or_default();
        let raw_country = getprop_val(self, device_id, "gsm.sim.operator.iso-country").await.unwrap_or_default();
        let net_op = getprop_val(self, device_id, "gsm.operator.alpha").await;
        let net_type = getprop_val(self, device_id, "gsm.network.type").await;
        let imei = getprop_val(self, device_id, "persist.radio.imei").await;

        // Dual-SIM: values are comma-separated (slot1,slot2)
        let sim_states: Vec<&str> = raw_state.split(',').collect();
        let sim_ops: Vec<&str> = raw_op.split(',').collect();
        let sim_countries: Vec<&str> = raw_country.split(',').collect();

        let mut sims = Vec::new();
        for i in 0..sim_states.len() {
            let state_str = sim_states[i].trim();
            let state = match state_str {
                "LOADED" => SimState::Loaded,
                "ABSENT" => SimState::Absent,
                _ => SimState::Unknown,
            };
            // Only add if there's useful info (present SIM)
            if state_str.is_empty() && state == SimState::Unknown {
                continue;
            }
            sims.push(SimInfo {
                slot: (i + 1) as u32,
                state,
                operator: sim_ops.get(i).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
                country: sim_countries.get(i).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
                imei: imei.clone(),
            });
        }

        let (_, _, _, roaming) = adb_parser::parse_telephony(&tele);

        Ok(NetworkInfo {
            sims,
            network_type: net_type.and_then(|t| {
                let parts: Vec<&str> = t.split(',').map(|s| s.trim()).filter(|s| !s.is_empty() && *s != "Unknown").collect();
                parts.last().map(|s| s.to_string())
            }),
            operator: net_op.and_then(|o| {
                let parts: Vec<&str> = o.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()).collect();
                parts.last().map(|s| s.to_string())
            }),
            is_roaming: roaming,
        })
    }

    async fn get_apps_info(&self, device_id: &str) -> anyhow::Result<AppsInfo> {
        let all_output = self.execute(&cmd::pm_list_all(device_id)).await?;
        let sys_output = self
            .execute(&cmd::pm_list_system(device_id))
            .await
            .unwrap_or_default();
        let user_output = self
            .execute(&cmd::pm_list_third(device_id))
            .await
            .unwrap_or_default();

        let all_apps = adb_parser::parse_packages(&all_output);
        let sys_count = sys_output.lines().filter(|l| l.starts_with("package:")).count() as u32;
        let user_count = user_output.lines().filter(|l| l.starts_with("package:")).count() as u32;

        Ok(AppsInfo {
            total: all_apps.len() as u32,
            system: sys_count,
            user: user_count,
            apps: all_apps,
        })
    }

    async fn run_shell(&self, device_id: &str, command: &str) -> anyhow::Result<String> {
        self.execute(&cmd::shell(device_id, command)).await
    }
}
