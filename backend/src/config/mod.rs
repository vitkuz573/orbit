#[derive(Debug, Clone)]
pub struct Settings {
    pub host: String,
    pub port: u16,
    pub log_level: String,
    pub adb_path: String,
    pub allowed_origins: Vec<String>,
}

impl Settings {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            host: std::env::var("ORBIT__HOST").unwrap_or_else(|_| "127.0.0.1".into()),
            port: std::env::var("ORBIT__PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(8080),
            log_level: std::env::var("ORBIT__LOG_LEVEL").unwrap_or_else(|_| "info".into()),
            adb_path: std::env::var("ORBIT__ADB_PATH").unwrap_or_else(|_| {
                which_adb().unwrap_or_else(|| "/usr/bin/adb".into())
            }),
            allowed_origins: std::env::var("ORBIT__ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".into())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
        })
    }
}

fn which_adb() -> Option<String> {
    std::process::Command::new("which")
        .arg("adb")
        .output()
        .ok()
        .and_then(|o| {
            String::from_utf8(o.stdout)
                .ok()
                .map(|s| s.trim().to_string())
        })
        .filter(|s| !s.is_empty())
}
