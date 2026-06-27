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

pub fn parse_disk_usage(output: &str) -> (Vec<Partition>, u64, u64, u64) {
    let mut partitions = Vec::new();
    let mut total_app = 0u64;
    let mut total_data = 0u64;
    let mut total_cache = 0u64;

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
    }

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

    (partitions, total_app, total_data, total_cache)
}

fn parse_diskstats_value(output: &str, key: &str) -> Option<u64> {
    let re = Regex::new(&format!(r"(?m){}\s*(\d+)", regex::escape(key))).ok()?;
    re.captures(output)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().parse::<u64>().ok())
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

    BatteryInfo {
        level,
        status: battery_status_str(status_code),
        health: battery_health_str(health_code),
        voltage: voltage / 1000.0,
        temperature: temp as f64 / 10.0,
        technology,
        is_charging: status_code == 2,
        charge_counter,
        max_charging_current: max_current,
        max_charging_voltage: max_voltage,
        power_source: power_source.to_string(),
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

    // Format: package:/path/to/base.apk=com.example.app
    let re = Regex::new(r"(?m)^package:(\S+)=(\S+)").unwrap();

    for cap in re.captures_iter(output) {
        let path = cap[1].to_string();
        let pkg = cap[2].to_string();
        let is_system = path.contains("/system/")
            || path.contains("/product/")
            || path.contains("/vendor/")
            || path.contains("/system_ext/");

        apps.push(AppEntry {
            package_name: pkg,
            is_system,
            apk_path: Some(path),
        });
    }

    apps
}
