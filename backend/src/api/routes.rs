use actix_web::{web, HttpRequest, HttpResponse};
use actix_ws::Message;
use tokio::process::Command;
use tracing::{error, info};

use crate::application::{device_service::DeviceService, report_service::ReportService};
use crate::config::Settings;

// ─── DTOs ───────────────────────────────────────────────────────────────────

#[derive(serde::Serialize)]
pub struct ApiResponse<T: serde::Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: serde::Serialize> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(msg: impl Into<String>) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg.into()),
        }
    }
}

// ─── Handlers ───────────────────────────────────────────────────────────────

pub async fn list_devices(svc: web::Data<DeviceService>) -> HttpResponse {
    match svc.list_devices().await {
        Ok(devices) => HttpResponse::Ok().json(ApiResponse::ok(devices)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_device(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.get_device(&device_id).await {
        Ok(device) => HttpResponse::Ok().json(ApiResponse::ok(device)),
        Err(e) => HttpResponse::NotFound().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_info(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.get_info(&device_id).await {
        Ok(info) => HttpResponse::Ok().json(ApiResponse::ok(info)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_system(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.get_system(&device_id).await {
        Ok(sys) => HttpResponse::Ok().json(ApiResponse::ok(sys)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_storage(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.get_storage(&device_id).await {
        Ok(storage) => HttpResponse::Ok().json(ApiResponse::ok(storage)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_battery(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.get_battery(&device_id).await {
        Ok(battery) => HttpResponse::Ok().json(ApiResponse::ok(battery)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_network(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.get_network(&device_id).await {
        Ok(network) => HttpResponse::Ok().json(ApiResponse::ok(network)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_apps(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.get_apps(&device_id).await {
        Ok(apps) => HttpResponse::Ok().json(ApiResponse::ok(apps)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

pub async fn get_report(
    svc: web::Data<ReportService>,
    path: web::Path<String>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.generate_report(&device_id).await {
        Ok(report) => HttpResponse::Ok().json(ApiResponse::ok(report)),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<()>::err(e.to_string())),
    }
}

#[derive(serde::Deserialize)]
pub struct ShellQuery {
    pub command: String,
}

pub async fn post_shell(
    svc: web::Data<DeviceService>,
    path: web::Path<String>,
    query: web::Query<ShellQuery>,
) -> HttpResponse {
    let device_id = path.into_inner();
    match svc.shell(&device_id, &query.command).await {
        Ok(output) => HttpResponse::Ok().json(ApiResponse::ok(output)),
        Err(e) => HttpResponse::BadRequest().json(ApiResponse::<()>::err(e.to_string())),
    }
}

// ─── WebSocket Shell ────────────────────────────────────────────────────────

pub async fn shell_ws(
    req: HttpRequest,
    stream: web::Payload,
    path: web::Path<String>,
    cfg: web::Data<Settings>,
) -> Result<HttpResponse, actix_web::Error> {
    let device_id = path.into_inner();
    let adb_path = cfg.adb_path.clone();

    let (response, mut session, msg_stream) = actix_ws::handle(&req, stream)?;

    actix_web::rt::spawn(async move {
        info!("Spawning shell for device {}", device_id);

        let mut child = match Command::new(&adb_path)
            .args(["-s", &device_id, "shell", "-tt"])
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                error!("Failed to spawn adb shell: {}", e);
                let _ = session.text(format!("\r\n\x1b[31mError: failed to start shell: {}\x1b[0m\r\n", e)).await;
                return;
            }
        };

        info!("Shell spawned, PID: {:?}", child.id());

        let mut stdin = match child.stdin.take() {
            Some(s) => s,
            None => {
                error!("stdin not captured");
                return;
            }
        };
        let stdout = match child.stdout.take() {
            Some(s) => s,
            None => {
                error!("stdout not captured");
                return;
            }
        };
        let stderr = match child.stderr.take() {
            Some(s) => s,
            None => {
                error!("stderr not captured");
                return;
            }
        };

        let ws = session.clone();

        // Forward stdout → WebSocket
        actix_web::rt::spawn(async move {
            use tokio::io::AsyncReadExt;
            let mut buf = [0u8; 4096];
            let mut out = stdout;
            let mut sess = ws;
            loop {
                match out.read(&mut buf).await {
                    Ok(0) => {
                        info!("stdout EOF");
                        break;
                    }
                    Ok(n) => {
                        info!("stdout read {} bytes", n);
                        let _ = sess.text(String::from_utf8_lossy(&buf[..n]).to_string()).await;
                    }
                    Err(e) => {
                        info!("stdout error: {}", e);
                        break;
                    }
                }
            }
        });

        // Forward stderr → WebSocket
        let ws2 = session.clone();
        actix_web::rt::spawn(async move {
            use tokio::io::AsyncReadExt;
            let mut buf = [0u8; 4096];
            let mut err = stderr;
            let mut sess = ws2;
            loop {
                match err.read(&mut buf).await {
                    Ok(0) => {
                        info!("stderr EOF");
                        break;
                    }
                    Ok(n) => {
                        info!("stderr read {} bytes", n);
                        let _ = sess.text(String::from_utf8_lossy(&buf[..n]).to_string()).await;
                    }
                    Err(e) => {
                        info!("stderr error: {}", e);
                        break;
                    }
                }
            }
        });

        // Forward WebSocket → subprocess stdin
        use tokio::io::AsyncWriteExt;
        let mut msg_stream = msg_stream;
        while let Some(Ok(msg)) = msg_stream.recv().await {
            match msg {
                Message::Text(text) => {
                    if stdin.write_all(text.as_bytes()).await.is_err() {
                        break;
                    }
                    let _ = stdin.flush().await;
                }
                Message::Binary(data) => {
                    if stdin.write_all(&data).await.is_err() {
                        break;
                    }
                    let _ = stdin.flush().await;
                }
                Message::Ping(bytes) => {
                    let _ = session.pong(&bytes).await;
                }
                Message::Close(_) => break,
                _ => {}
            }
        }

        // Cleanup
        let _ = child.kill().await;
        let _ = child.wait().await;
        info!("Shell session closed for device {}", device_id);
    });

    Ok(response)
}

// ─── Route config ───────────────────────────────────────────────────────────

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .route("/devices", web::get().to(list_devices))
            .route("/devices/{device_id}", web::get().to(get_device))
            .route("/devices/{device_id}/info", web::get().to(get_info))
            .route("/devices/{device_id}/system", web::get().to(get_system))
            .route("/devices/{device_id}/storage", web::get().to(get_storage))
            .route("/devices/{device_id}/battery", web::get().to(get_battery))
            .route("/devices/{device_id}/network", web::get().to(get_network))
            .route("/devices/{device_id}/apps", web::get().to(get_apps))
            .route("/devices/{device_id}/report", web::get().to(get_report))
            .route("/devices/{device_id}/shell", web::post().to(post_shell))
            .route("/devices/{device_id}/shell/ws", web::get().to(shell_ws)),
    );
}
