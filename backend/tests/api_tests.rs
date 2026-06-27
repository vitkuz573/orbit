use orbit_backend::domain::models::*;

#[test]
fn test_device_status_from_str() {
    assert!(matches!(DeviceStatus::from("device"), DeviceStatus::Device));
    assert!(matches!(
        DeviceStatus::from("unauthorized"),
        DeviceStatus::Unauthorized
    ));
    assert!(matches!(DeviceStatus::from("offline"), DeviceStatus::Offline));
    assert!(matches!(DeviceStatus::from("unknown"), DeviceStatus::Unknown));
    assert!(matches!(DeviceStatus::from("foo"), DeviceStatus::Unknown));
}

#[test]
fn test_battery_voltage_conversion() {
    let voltage_mv = 3692;
    let voltage_v = voltage_mv as f64 / 1000.0;
    assert!((voltage_v - 3.692).abs() < 0.001);
}

#[test]
fn test_memory_usage_percent() {
    let mem = MemoryInfo {
        total_kb: 7795880,
        used_kb: 6000000,
        free_kb: 1795880,
    };
    let pct = mem.usage_percent();
    assert!((pct - 76.96).abs() < 0.1);
}

#[test]
fn test_memory_usage_percent_zero_total() {
    let mem = MemoryInfo {
        total_kb: 0,
        used_kb: 0,
        free_kb: 0,
    };
    assert_eq!(mem.usage_percent(), 0.0);
}
