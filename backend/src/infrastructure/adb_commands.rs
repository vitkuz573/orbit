use std::fmt;

#[derive(Debug, Clone)]
pub struct AdbCommand {
    pub args: Vec<String>,
}

impl AdbCommand {
    pub fn new(device_id: &str, args: impl IntoIterator<Item = impl Into<String>>) -> Self {
        let mut cmd = vec!["-s".into(), device_id.into()];
        cmd.extend(args.into_iter().map(Into::into));
        Self { args: cmd }
    }

    pub fn global(args: impl IntoIterator<Item = impl Into<String>>) -> Self {
        Self {
            args: args.into_iter().map(Into::into).collect(),
        }
    }

    pub fn to_vec(&self) -> Vec<&str> {
        let mut cmd = vec!["adb"];
        cmd.extend(self.args.iter().map(|s| s.as_str()));
        cmd
    }
}

impl fmt::Display for AdbCommand {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "adb {}", self.args.join(" "))
    }
}

// ─── Global commands ────────────────────────────────────────────────────────

pub fn devices() -> AdbCommand {
    AdbCommand::global(["devices", "-l"])
}

// ─── Device-scoped commands ─────────────────────────────────────────────────

pub fn shell(device: &str, command: &str) -> AdbCommand {
    AdbCommand::new(device, ["shell", command])
}

pub fn getprop_all(device: &str) -> AdbCommand {
    shell(device, "getprop")
}

pub fn cpuinfo(device: &str) -> AdbCommand {
    shell(device, "cat /proc/cpuinfo")
}

pub fn meminfo(device: &str) -> AdbCommand {
    shell(device, "cat /proc/meminfo")
}

pub fn disk_usage(device: &str) -> AdbCommand {
    shell(device, "df -h")
}

pub fn dumpsys_battery(device: &str) -> AdbCommand {
    shell(device, "dumpsys battery")
}

pub fn wm_size(device: &str) -> AdbCommand {
    shell(device, "wm size")
}

pub fn wm_density(device: &str) -> AdbCommand {
    shell(device, "wm density")
}

pub fn pm_list_all(device: &str) -> AdbCommand {
    shell(device, "pm list packages -f")
}

pub fn pm_list_system(device: &str) -> AdbCommand {
    shell(device, "pm list packages -s")
}

pub fn pm_list_third(device: &str) -> AdbCommand {
    shell(device, "pm list packages -3")
}

pub fn dumpsys_telephony(device: &str) -> AdbCommand {
    shell(device, "dumpsys telephony.registry")
}

pub fn uname(device: &str) -> AdbCommand {
    shell(device, "uname -a")
}

pub fn proc_version(device: &str) -> AdbCommand {
    shell(device, "cat /proc/version")
}

pub fn ps_list(device: &str) -> AdbCommand {
    shell(device, "ps -A -o PID,PPID,%CPU,%MEM,RSS:8,VSZ:8,USER,NAME")
}

pub fn dump_sensors(device: &str) -> AdbCommand {
    shell(device, "dumpsys sensorservice 2>/dev/null")
}

pub fn thermal_zones(device: &str) -> AdbCommand {
    shell(device, "cat /sys/class/thermal/thermal_zone*/type 2>/dev/null; echo '---'; cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null; true")
}

pub fn ip_addr(device: &str) -> AdbCommand {
    shell(device, "ip addr show 2>/dev/null || ifconfig 2>/dev/null")
}

pub fn dump_input(device: &str) -> AdbCommand {
    shell(device, "dumpsys input 2>/dev/null")
}

pub fn dump_location(device: &str) -> AdbCommand {
    shell(device, "dumpsys location 2>/dev/null")
}
