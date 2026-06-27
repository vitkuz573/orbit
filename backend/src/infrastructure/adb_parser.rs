use regex::Regex;

use crate::domain::models::*;

pub fn parse_devices(output: &str) -> Vec<Device> {
    let mut devices = Vec::new();
    let re = Regex::new(
        r"(?m)^(\S+)\s+(device|unauthorized|offline)(?:\s+.*?model:(\S+))?(?:\s+.*?device:(\S+))?",
    )
    .unwrap();

    for cap in re.captures_iter(output) {
        let id = cap[1].to_string();
        let status = DeviceStatus::from(&cap[2] as &str);
        devices.push(Device {
            id,
            status,
            model: cap.get(3).map(|m| m.as_str().to_string()),
            manufacturer: None,
            market_name: None,
            android_version: None,
            sdk: None,
            battery_level: None,
            is_charging: None,
        });
    }

    devices
}

pub fn parse_getprop(output: &str, key: &str) -> Option<String> {
    let pattern = format!(r"(?m)^\[{}\]\s*:\s*\[(.*?)\]$", regex::escape(key));
    let re = Regex::new(&pattern).ok()?;
    re.captures(output)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
}

pub fn parse_display_size(output: &str) -> Option<String> {
    let re = Regex::new(r"Physical size:\s*(\d+x\d+)").ok()?;
    re.captures(output)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string())
}

pub fn parse_display_density(output: &str) -> Option<u32> {
    let re = Regex::new(r"Physical density:\s*(\d+)").ok()?;
    re.captures(output)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse().ok())
}

pub fn parse_cpu_info(output: &str) -> CpuInfo {
    let cores = output.matches("processor\t:").count() as u32;

    let features = output
        .lines()
        .find(|l| l.trim().starts_with("Features"))
        .map(|l| {
            l.split(':')
                .nth(1)
                .unwrap_or("")
                .split_whitespace()
                .map(|s| s.to_string())
                .collect()
        })
        .unwrap_or_default();

    let bogo = output
        .lines()
        .find(|l| l.trim().starts_with("BogoMIPS"))
        .and_then(|l| l.split(':').nth(1))
        .and_then(|s| s.trim().parse::<f64>().ok())
        .unwrap_or(0.0);

    let arch = output
        .lines()
        .find(|l| l.trim().starts_with("Processor"))
        .map(|l| l.split(':').nth(1).unwrap_or("").trim().to_string())
        .unwrap_or_default();

    CpuInfo {
        architecture: arch,
        cores,
        features,
        bogo_mips: bogo,
    }
}

pub fn parse_meminfo(output: &str) -> (MemoryInfo, MemoryInfo) {
    let total = parse_mem_value(output, "MemTotal").unwrap_or(0);
    let free = parse_mem_value(output, "MemFree").unwrap_or(0);
    let avail = parse_mem_value(output, "MemAvailable").unwrap_or(0);
    let used = total.saturating_sub(avail);

    let ram = MemoryInfo {
        total_kb: total,
        used_kb: used,
        free_kb: free,
    };

    let swap_total = parse_mem_value(output, "SwapTotal").unwrap_or(0);
    let swap_free = parse_mem_value(output, "SwapFree").unwrap_or(0);

    let swap = MemoryInfo {
        total_kb: swap_total,
        used_kb: swap_total.saturating_sub(swap_free),
        free_kb: swap_free,
    };

    (ram, swap)
}

fn parse_mem_value(output: &str, key: &str) -> Option<u64> {
    let pattern = format!(r"(?m)^{}:\s*(\d+)", regex::escape(key));
    let re = Regex::new(&pattern).ok()?;
    re.captures(output)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<u64>().ok())
}

pub fn parse_disk_usage(output: &str) -> (Vec<Partition>, u64, u64, u64, u64, u64, u64, u64, u64, u64, u64, u64, u64, bool, u64, u64, u64, u64, u64, u64, Option<u64>, Vec<AppStorageEntry>) {
    let mut partitions = Vec::new();
    let mut total_app = 0u64;
    let mut total_data = 0u64;
    let mut total_cache = 0u64;
    let mut data_total = 0u64;
    let mut data_free = 0u64;
    let mut data_free_pct = 0u64;
    let mut cache_total = 0u64;
    let mut cache_free = 0u64;
    let mut system_total = 0u64;
    let mut system_free = 0u64;
    let mut metadata_total = 0u64;
    let mut metadata_free = 0u64;
    let mut fbe = false;
    let mut photos = 0u64;
    let mut videos = 0u64;
    let mut audio = 0u64;
    let mut downloads = 0u64;
    let mut system_size = 0u64;
    let mut other_size = 0u64;
    let mut write_speed: Option<u64> = None;

    // Parse dumpsys diskstats output first
    if output.contains("App Size:") {
        if let Some(v) = parse_diskstats_value(output, "App Size:") {
            total_app = v;
        }
        if let Some(v) = parse_diskstats_value(output, "App Data Size:") {
            total_data = v;
        }
        if let Some(v) = parse_diskstats_value(output, "App Cache Size:") {
            total_cache = v;
        }
        if let Some(v) = parse_diskstats_value(output, "Photos Size:") {
            photos = v;
        }
        if let Some(v) = parse_diskstats_value(output, "Videos Size:") {
            videos = v;
        }
        if let Some(v) = parse_diskstats_value(output, "Audio Size:") {
            audio = v;
        }
        if let Some(v) = parse_diskstats_value(output, "Downloads Size:") {
            downloads = v;
        }
        if let Some(v) = parse_diskstats_value(output, "System Size:") {
            system_size = v;
        }
        if let Some(v) = parse_diskstats_value(output, "Other Size:") {
            other_size = v;
        }
    }

    // Parse Data-Free line: Data-Free: 147363192K / 235722716K total = 62% free
    let free_re = Regex::new(r"(?m)^(\w+)-Free:\s*(\d+)K\s*/\s*(\d+)K\s*total\s*=\s*(\d+)%\s*free").unwrap();
    for cap in free_re.captures_iter(output) {
        let section = &cap[1];
        let free_kb = cap[2].parse::<u64>().unwrap_or(0);
        let total_kb = cap[3].parse::<u64>().unwrap_or(0);
        let pct = cap[4].parse::<u64>().unwrap_or(0);
        match section {
            "Data" => { data_free = free_kb * 1024; data_total = total_kb * 1024; data_free_pct = pct as u64; }
            "Cache" => { cache_free = free_kb * 1024; cache_total = total_kb * 1024; }
            "System" => { system_free = free_kb * 1024; system_total = total_kb * 1024; }
            "Metadata" => { metadata_free = free_kb * 1024; metadata_total = total_kb * 1024; }
            _ => {}
        }
    }

    // File-based Encryption
    if let Some(v) = parse_diskstats_line(output, "File-based Encryption:") {
        fbe = v.trim() == "true";
    }

    // Disk Write Speed
    let speed_re = Regex::new(r"Recent Disk Write Speed \(kB/s\)\s*=\s*(\d+)").unwrap();
    if let Some(cap) = speed_re.captures(output) {
        write_speed = cap[1].parse::<u64>().ok();
    }

    // Per-app storage
    app_storage = parse_app_storage_from_diskstats(output);

    // Parse df output
    let re = Regex::new(
        r"(?m)^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)%\s+(/\S+)",
    )
    .unwrap();

    for cap in re.captures_iter(output) {
        let mount = cap[6].to_string();
        if mount.starts_with("/apex") || mount.starts_with("/dev") || mount.starts_with("/proc")
        {
            continue;
        }
        partitions.push(Partition {
            mount,
            fs: cap[1].to_string(),
            total: cap[2].to_string(),
            used: cap[3].to_string(),
            avail: cap[4].to_string(),
            usage_pct: cap[5].parse().unwrap_or(0),
        });
    }

    (partitions, total_app, total_data, total_cache,
     data_total, data_free, data_free_pct,
     cache_total, cache_free,
     system_total, system_free,
     metadata_total, metadata_free,
     fbe, photos, videos, audio, downloads,
     system_size, other_size,
     write_speed, app_storage)
}

fn parse_diskstats_value(output: &str, key: &str) -> Option<u64> {
    let re = Regex::new(&format!(r"(?m){}\s*(\d+)", regex::escape(key))).ok()?;
    re.captures(output)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<u64>().ok())
}

fn parse_diskstats_line(output: &str, key: &str) -> Option<String> {
    let re = Regex::new(&format!(r"(?m)^{}\s*(.+)", regex::escape(key))).ok()?;
    re.captures(output)
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().trim().to_string())
}

fn parse_app_storage_from_diskstats(output: &str) -> Vec<AppStorageEntry> {
    // Parse Package Names: ["pkg1", "pkg2", ...]
    let names_re = Regex::new(r#"(?m)^Package Names:\s*\[(.*?)\]"#).unwrap();
    // Parse App Sizes: [123, 456, ...]
    let sizes_re = Regex::new(r"(?m)^App Sizes:\s*\[(.*?)\]").unwrap();
    // Parse App Data Sizes: [789, 012, ...]
    let data_re = Regex::new(r"(?m)^App Data Sizes:\s*\[(.*?)\]").unwrap();
    // Parse Cache Sizes: [345, 678, ...]
    let cache_re = Regex::new(r"(?m)^Cache Sizes:\s*\[(.*?)\]").unwrap();

    let names = names_re.captures(output)
        .and_then(|c| c.get(1))
        .map(|m| parse_csv_bracketed(m.as_str()))
        .unwrap_or_default();

    let sizes = sizes_re.captures(output)
        .and_then(|c| c.get(1))
        .map(|m| parse_csv_u64(m.as_str()))
        .unwrap_or_default();

    let data_sizes = data_re.captures(output)
        .and_then(|c| c.get(1))
        .map(|m| parse_csv_u64(m.as_str()))
        .unwrap_or_default();

    let cache_sizes = cache_re.captures(output)
        .and_then(|c| c.get(1))
        .map(|m| parse_csv_u64(m.as_str()))
        .unwrap_or_default();

    let mut entries = Vec::new();
    let max_len = names.len().max(sizes.len()).max(data_sizes.len()).max(cache_sizes.len());
    for i in 0..max_len {
        let pkg = names.get(i).cloned().unwrap_or_default();
        if pkg.is_empty() {
            continue;
        }
        entries.push(AppStorageEntry {
            package_name: pkg,
            app_size_bytes: sizes.get(i).copied().unwrap_or(0),
            data_size_bytes: data_sizes.get(i).copied().unwrap_or(0),
            cache_size_bytes: cache_sizes.get(i).copied().unwrap_or(0),
        });
    }

    entries
}

fn parse_csv_bracketed(s: &str) -> Vec<String> {
    s.split(',')
        .map(|s| s.trim().trim_matches('"').to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

fn parse_csv_u64(s: &str) -> Vec<u64> {
    s.split(',')
        .map(|s| s.trim().parse::<u64>().unwrap_or(0))
        .collect()
}

pub fn parse_stat_data(output: &str) -> (Option<String>, Option<u64>) {
    let fs_type = Regex::new(r"Type:\s*(\S+)").ok()
        .and_then(|re| re.captures(output))
        .and_then(|c| c.get(1))
        .map(|m| m.as_str().to_string());

    let block_size = Regex::new(r"Block Size:\s*(\d+)").ok()
        .and_then(|re| re.captures(output))
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<u64>().ok());

    (fs_type, block_size)
}

pub fn parse_battery(output: &str) -> BatteryInfo {
    let get = |key: &str| -> Option<String> {
        let re = Regex::new(&format!(r"(?m)^\s*{}:\s*(.+)$", regex::escape(key)))
            .ok()?;
        re.captures(output)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().trim().to_string())
    };

    let level: u32 = get("level")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);

    let status_code: u32 = get("status")
        .and_then(|v| v.parse().ok())
        .unwrap_or(1);

    let health_code: u32 = get("health")
        .and_then(|v| v.parse().ok())
        .unwrap_or(1);

    let voltage: f64 = get("voltage")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0.0);

    let temp: f64 = get("temperature")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0.0);

    let technology = get("technology").unwrap_or_default();

    let charge_counter: Option<u32> = get("charge counter").and_then(|v| v.parse().ok());

    let max_current = get("Max charging current").and_then(|v| v.parse().ok());
    let max_voltage = get("Max charging voltage").and_then(|v| v.parse().ok());

    let power_source = if get("AC powered").as_deref() == Some("true") {
        "ac"
    } else if get("USB powered").as_deref() == Some("true") {
        "usb"
    } else if get("Wireless powered").as_deref() == Some("true") {
        "wireless"
    } else {
        "battery"
    };

    let voltage_uv = max_voltage.unwrap_or(0);
    let current_ua = max_current.unwrap_or(0);
    let charging = status_code == 2;
    let is_fast_charge = charging && (voltage_uv > 5_000_000 || current_ua > 1_500_000);

    let charging_protocol = if is_fast_charge {
        Some(infer_protocol(voltage_uv, current_ua))
    } else {
        None
    };

    BatteryInfo {
        level,
        status: battery_status_str(status_code),
        health: battery_health_str(health_code),
        voltage: voltage / 1000.0,
        temperature: temp as f64 / 10.0,
        technology,
        is_charging: charging,
        charge_counter,
        max_charging_current: max_current,
        max_charging_voltage: max_voltage,
        power_source: power_source.to_string(),
        is_fast_charge,
        charging_protocol,
    }
}

fn battery_status_str(code: u32) -> String {
    match code {
        1 => "unknown".into(),
        2 => "charging".into(),
        3 => "discharging".into(),
        4 => "not_charging".into(),
        5 => "full".into(),
        _ => format!("unknown({})", code),
    }
}

fn battery_health_str(code: u32) -> String {
    match code {
        1 => "unknown".into(),
        2 => "good".into(),
        3 => "overheat".into(),
        4 => "dead".into(),
        5 => "over_voltage".into(),
        6 => "unspecified_failure".into(),
        7 => "cold".into(),
        _ => format!("unknown({})", code),
    }
}

fn infer_protocol(voltage_uv: u32, _current_ua: u32) -> String {
    if voltage_uv >= 9_000_000 {
        "QC/PD (9-12V)".into()
    } else {
        "Fast Charge".into()
    }
}

pub fn parse_telephony(output: &str) -> (Option<String>, Option<String>, Option<String>, bool) {
    let operator = output
        .lines()
        .find(|l| l.contains("mOperatorAlphaLong"))
        .and_then(|l| {
            let re = Regex::new(r"mOperatorAlphaLong=(\S+)").ok()?;
            re.captures(l).and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
        });

    let network = output
        .lines()
        .find(|l| l.contains("mDataRegState"))
        .map(|l| {
            if l.contains("IN_SERVICE") { "LTE".to_string() }
            else if l.contains("OUT_OF_SERVICE") { "no_service".to_string() }
            else { "unknown".to_string() }
        });

    let roaming = output.contains("mRoaming=true") || output.contains("isRoaming=true");

    let imei = None;

    (operator, network, imei, roaming)
}

pub fn parse_packages(output: &str) -> Vec<AppEntry> {
    let mut apps: Vec<AppEntry> = Vec::new();

    // Format: package:/path/to/base.apk=com.example.app versionCode:123  installer=com.x uid:456
    let re = Regex::new(
        r"(?m)^package:(\S+)=(\S+?)(?:\s+versionCode:(\d+))?(?:\s+installer=(\S+))?\s+uid:\d+(?:,\d+)?"
    ).unwrap();

    for cap in re.captures_iter(output) {
        let path = cap[1].to_string();
        let pkg = cap[2].to_string();
        let is_system = path.contains("/system/")
            || path.contains("/product/")
            || path.contains("/vendor/")
            || path.contains("/system_ext/");
        let version_code = cap.get(3).and_then(|m| m.as_str().parse::<u64>().ok());
        let installer = cap.get(4).map(|m| m.as_str().to_string()).filter(|s| s != "null");

        apps.push(AppEntry {
            package_name: pkg,
            is_system,
            apk_path: Some(path),
            uid: None, // filled below
            version_code,
            version_name: None,
            target_sdk: None,
            data_dir: None,
            first_install_time: None,
            last_update_time: None,
            installer,
            debuggable: None,
        });
    }

    // Also extract uid from format: package:... uid:123
    let uid_re = Regex::new(r"(?m)^package:(\S+)=(\S+?)(?:\s+versionCode:\d+)?(?:\s+installer=\S+)?\s+uid:(\d+)").unwrap();
    for cap in uid_re.captures_iter(output) {
        let pkg = cap[2].to_string();
        if let Ok(uid) = cap[3].parse::<u32>() {
            if let Some(app) = apps.iter_mut().find(|a| a.package_name == pkg) {
                app.uid = Some(uid);
            }
        }
    }

    apps
}

pub fn enrich_packages_from_dump(output: &str, apps: &mut [AppEntry]) {
    let header_re = Regex::new(r"^  Package \[(.+?)\]").unwrap();
    let mut current_pkg: Option<&mut AppEntry> = None;

    for line in output.lines() {
        if let Some(cap) = header_re.captures(line) {
            let name = cap[1].to_string();
            current_pkg = apps.iter_mut().find(|a| a.package_name == name);
            continue;
        }

        let Some(app) = current_pkg.as_mut() else { continue };
        let trimmed = line.trim();

        if let Some(val) = trimmed.strip_prefix("versionName=") {
            app.version_name = Some(val.to_string());
        }

        if let Some(val) = trimmed.strip_prefix("versionCode=") {
            let parts: Vec<&str> = val.split_whitespace().collect();
            if app.version_code.is_none() {
                app.version_code = parts.first().and_then(|v| v.parse::<u64>().ok());
            }
            for part in &parts {
                if let Some(sdk) = part.strip_prefix("targetSdk=") {
                    app.target_sdk = sdk.parse::<u32>().ok();
                }
            }
        }

        if let Some(val) = trimmed.strip_prefix("timeStamp=") {
            app.first_install_time = Some(val.to_string());
        }

        if let Some(val) = trimmed.strip_prefix("lastUpdateTime=") {
            app.last_update_time = Some(val.to_string());
        }

        if let Some(val) = trimmed.strip_prefix("dataDir=") {
            app.data_dir = Some(val.to_string());
        }

        if trimmed.starts_with("flags=[") && trimmed.contains("DEBUGGABLE") {
            app.debuggable = Some(true);
        }
    }
}

// ─── Processes ──────────────────────────────────────────────────────────────

pub fn parse_processes(output: &str) -> ProcessesInfo {
    let mut processes = Vec::new();
    for line in output.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 8 {
            continue;
        }
        let pid = parts[0].parse::<u32>().unwrap_or(0);
        let ppid = parts[1].parse::<u32>().unwrap_or(0);
        let cpu_pct = parts[2].parse::<f32>().unwrap_or(0.0);
        let mem_pct = parts[3].parse::<f32>().unwrap_or(0.0);
        let rss = parts[4].parse::<u64>().unwrap_or(0);
        let vsz = parts[5].parse::<u64>().unwrap_or(0);
        let user = parts[6].to_string();
        let name = parts[7..].join(" ");
        if pid == 0 {
            continue;
        }
        processes.push(ProcessEntry {
            pid, ppid, cpu_pct, mem_pct,
            rss_kb: rss, vsz_kb: vsz,
            user, name,
        });
    }
    let total = processes.len() as u32;
    ProcessesInfo { total, processes }
}

// ─── Sensors ────────────────────────────────────────────────────────────────

pub fn parse_sensors(output: &str) -> SensorsInfo {
    let mut sensors = Vec::new();
    let re = Regex::new(
        r"^0x[0-9a-f]+\)\s+(.+?)\s*\|\s*(.+?)\s*\|\s*ver:.*?type:\s+(\S+)"
    ).unwrap();

    let mut in_list = false;
    for line in output.lines() {
        if line.trim() == "Sensor List:" {
            in_list = true;
            continue;
        }
        if !in_list {
            continue;
        }
        // Continuation lines from sensor properties
        if line.starts_with('\t') || line.starts_with("  ") {
            continue;
        }
        if !line.starts_with("0x") {
            break;
        }

        if let Some(cap) = re.captures(line) {
            sensors.push(SensorEntry {
                name: cap[1].trim().to_string(),
                vendor: cap[2].trim().to_string(),
                sensor_type: cap[3].trim().to_string(),
                value: 0.0,
                power_ma: 0.0,
            });
        }
    }

    SensorsInfo { sensors }
}

// ─── Thermal ────────────────────────────────────────────────────────────────

pub fn parse_thermal(output: &str) -> ThermalInfo {
    let mut zones = Vec::new();
    let parts: Vec<&str> = output.split("\n---\n").collect();
    if parts.len() < 2 {
        return ThermalInfo { zones };
    }
    let names: Vec<&str> = parts[0].lines().collect();
    let temps: Vec<&str> = parts[1].lines().collect();

    for (i, name) in names.iter().enumerate() {
        let name = name.trim();
        if name.is_empty() { continue; }
        let temp_str = temps.get(i).unwrap_or(&"").trim();
        let temp_c = temp_str.parse::<f64>().unwrap_or(0.0) / 1000.0;
        zones.push(ThermalZone {
            name: name.to_string(),
            temp_c,
        });
    }

    ThermalInfo { zones }
}

// ─── Connectivity ───────────────────────────────────────────────────────────

pub fn parse_connectivity(output: &str) -> ConnectivityInfo {
    let mut interfaces = Vec::new();

    // Try ip addr show format first
    let re = Regex::new(r"(?m)^(\d+):\s+(\S+):\s+<(.+?)>.*\n\s+link/ether\s+(\S+)").unwrap();
    let mut ipv4_map: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    let mut ipv6_map: std::collections::HashMap<String, String> = std::collections::HashMap::new();

    // Extract IPs
    let ip_re = Regex::new(r"(?m)^\s+inet\s+(\S+)\s+.*\s+(\S+):$").unwrap();
    for cap in ip_re.captures_iter(output) {
        let ip = cap[1].to_string();
        let iface = cap[2].to_string();
        ipv4_map.insert(iface, ip);
    }

    let ip6_re = Regex::new(r"(?m)^\s+inet6\s+(\S+)\s+.*\s+(\S+):$").unwrap();
    for cap in ip6_re.captures_iter(output) {
        let ip = cap[1].to_string();
        let iface = cap[2].to_string();
        ipv6_map.insert(iface, ip);
    }

    for cap in re.captures_iter(output) {
        let name = cap[2].to_string();
        let flags = cap[3].to_string();
        let mac = cap[4].to_string();
        let state = if flags.contains("UP") { "up" } else { "down" };
        interfaces.push(InterfaceInfo {
            name: name.clone(),
            state: state.to_string(),
            ipv4: ipv4_map.get(&name).cloned(),
            ipv6: ipv6_map.get(&name).cloned(),
            mac: Some(mac),
        });
    }

    // If no interfaces found via ip, try ifconfig
    if interfaces.is_empty() {
        let if_re = Regex::new(r"(?m)^(\S+)\s+Link\s+encap:\S+\s+HWaddr\s+(\S+)").unwrap();
        for cap in if_re.captures_iter(output) {
            let name = cap[1].to_string();
            let mac = cap[2].to_string();
            interfaces.push(InterfaceInfo {
                name,
                state: "unknown".into(),
                ipv4: None,
                ipv6: None,
                mac: Some(mac),
            });
        }
    }

    ConnectivityInfo { interfaces }
}

// ─── Input ──────────────────────────────────────────────────────────────────

pub fn parse_input(output: &str) -> InputInfo {
    let mut devices = Vec::new();
    let re = Regex::new(r"^\s+(\d+):\s+(.+)$").unwrap();
    let mut lines = output.lines().peekable();
    let mut in_section = false;

    while let Some(line) = lines.next() {
        if line == "Event Hub State:" {
            in_section = true;
            continue;
        }
        if in_section {
            // Stop at next top-level section (non-indented, non-empty)
            if !line.starts_with(' ') && line.len() > 1 {
                break;
            }
            if line.trim() == "Devices:" {
                continue;
            }
            if let Some(cap) = re.captures(line) {
                if let Ok(id) = cap[1].parse::<u32>() {
                    let name = cap[2].trim().to_string();
                    let mut phys: Option<String> = None;
                    let mut sysfs: Option<String> = None;
                    let mut handler: Option<String> = None;

                    while let Some(prop) = lines.next_if(|l| l.starts_with("      ")) {
                        let p = prop.trim();
                        if let Some(val) = p.strip_prefix("Path: ") {
                            handler = Some(val.trim().to_string());
                        } else if let Some(val) = p.strip_prefix("Location: ") {
                            let v = val.trim().to_string();
                            if !v.is_empty() && v != "<none>" {
                                phys = Some(v);
                            }
                        } else if let Some(val) = p.strip_prefix("SysfsDevicePath: ") {
                            let v = val.trim().to_string();
                            if !v.is_empty() && v != "<none>" {
                                sysfs = Some(v);
                            }
                        }
                    }

                    devices.push(InputDevice { name, id, phys, sysfs, handler });
                }
            }
        }
    }

    InputInfo { devices }
}

// ─── Location ───────────────────────────────────────────────────────────────

pub fn parse_location(output: &str) -> LocationInfo {
    let mut providers: Vec<LocationProvider> = Vec::new();
    let mut is_gps = false;
    let mut is_network = false;
    let mut location_enabled = false;
    let mut current_provider: Option<(String, LocationProvider)> = None;
    let mut gps_started: Option<bool> = None;
    let mut gps_fix_interval: Option<u32> = None;

    let provider_re = Regex::new(r"^\s{4}(\w+(?:\s+\w+)*)\s+provider:").unwrap();
    let last_loc_re = Regex::new(
        r"last location=Location\[\w+\s+([\d.-]+),([\d.-]+)\s+hAcc=([\d.]+)(?:.*?\s+alt=([\d.-]+))?(?:.*?\s+vAcc=([\d.]+))?"
    ).unwrap();
    let props_re = Regex::new(
        r"properties=ProviderProperties\[powerUsage=(\w+),\s*accuracy=(\w+)(?:,\s*requires=([^,]+))?"
    ).unwrap();

    for line in output.lines() {
        let trimmed = line.trim();

        // Location Setting
        if trimmed == "Location Setting:" && !location_enabled {
            // Lines after this will have [uX] true/false
            continue;
        }
        if trimmed.starts_with("[u") && trimmed.ends_with("true") {
            location_enabled = true;
        }

        // mStarted / mFixInterval (gps state)
        if let Some(val) = trimmed.strip_prefix("mStarted=") {
            gps_started = Some(val.starts_with("true"));
        }
        if let Some(val) = trimmed.strip_prefix("mFixInterval=") {
            gps_fix_interval = val.parse::<u32>().ok();
        }

        // Provider section header
        if let Some(cap) = provider_re.captures(line) {
            // Save previous provider
            if let Some((name, lp)) = current_provider.take() {
                if name == "gps" && lp.enabled { is_gps = true; }
                if name == "network" && lp.enabled { is_network = true; }
                providers.push(lp);
            }
            let name = cap[1].to_string();
            current_provider = Some((name.clone(), LocationProvider {
                name,
                enabled: false,
                status: None,
                last_latitude: None,
                last_longitude: None,
                last_altitude: None,
                last_accuracy: None,
                last_vertical_accuracy: None,
                power_usage: None,
                accuracy_type: None,
                requires: None,
            }));
            continue;
        }

        let Some((_, lp)) = current_provider.as_mut() else { continue };

        if trimmed == "enabled=true" {
            lp.enabled = true;
        }

        if let Some(cap) = last_loc_re.captures(trimmed) {
            lp.last_latitude = cap[1].parse::<f64>().ok();
            lp.last_longitude = cap[2].parse::<f64>().ok();
            lp.last_accuracy = cap[3].parse::<f64>().ok();
            lp.last_altitude = cap.get(4).and_then(|m| m.as_str().parse::<f64>().ok());
            lp.last_vertical_accuracy = cap.get(5).and_then(|m| m.as_str().parse::<f64>().ok());
        }

        if let Some(cap) = props_re.captures(trimmed) {
            lp.power_usage = Some(cap[1].to_string());
            lp.accuracy_type = Some(cap[2].to_string());
            if let Some(req) = cap.get(3) {
                let v: Vec<String> = req.as_str().split(',').map(|s| s.trim().to_string()).collect();
                lp.requires = Some(v);
            }
        }
    }

    // Flush last provider
    if let Some((name, lp)) = current_provider.take() {
        if name == "gps" && lp.enabled { is_gps = true; }
        if name == "network" && lp.enabled { is_network = true; }
        providers.push(lp);
    }

    LocationInfo {
        providers,
        is_gps_enabled: is_gps,
        is_network_enabled: is_network,
        location_enabled,
        gps_started,
        gps_fix_interval,
    }
}
