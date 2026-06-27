use std::sync::Arc;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use tracing::info;
use tracing_subscriber::EnvFilter;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use orbit_backend::api::routes;
use orbit_backend::api::routes::ApiDoc;
use orbit_backend::application::{device_service::DeviceService, report_service::ReportService};
use orbit_backend::config::Settings;
use orbit_backend::infrastructure::AdbExecutor;

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    let settings = Settings::from_env()?;

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::new(&settings.log_level))
        .json()
        .init();

    info!(
        host = %settings.host,
        port = %settings.port,
        adb_path = %settings.adb_path,
        "starting orbit backend"
    );

    // Verify ADB is available
    let adb_check = std::process::Command::new(&settings.adb_path)
        .arg("version")
        .output();

    match adb_check {
        Ok(output) => {
            let version = String::from_utf8_lossy(&output.stdout);
            info!("adb available: {}", version.lines().next().unwrap_or("?"));
        }
        Err(e) => {
            anyhow::bail!(
                "ADB not found at '{}': {}. Install android-tools or set ORBIT__ADB_PATH",
                settings.adb_path,
                e
            );
        }
    }

    // Build infrastructure
    let adb: Arc<dyn orbit_backend::domain::AdbPort> =
        Arc::new(AdbExecutor::new(settings.adb_path.clone()));

    // Build application services
    let device_service = web::Data::new(DeviceService::new(adb.clone()));
    let report_service = web::Data::new(ReportService::new(adb));

    // Start HTTP server
    let host = settings.host.clone();
    let port = settings.port;
    let origins = settings.allowed_origins.clone();

    let origins_arc = std::sync::Arc::new(origins);

    HttpServer::new(move || {
        let origins = origins_arc.clone();
        let cors = Cors::default()
            .allowed_origin_fn(move |origin_header, _req| {
                let origin = origin_header.to_str().unwrap_or("");
                origins.iter().any(|o| o == origin) || origins.contains(&"*".to_string())
            })
            .allow_any_method()
            .allow_any_header()
            .supports_credentials();

        let openapi = ApiDoc::openapi();
        let openapi_json = openapi.clone();

        App::new()
            .wrap(cors)
            .app_data(device_service.clone())
            .app_data(report_service.clone())
            .app_data(web::Data::new(settings.clone()))
            .service(SwaggerUi::new("/api/v1/docs/{_:.*}")
                .url("/api/v1/openapi.json", openapi))
            .configure(routes::configure)
            .route("/api/v1/openapi.json", web::get().to(move || {
                let spec = openapi_json.clone();
                async move { actix_web::HttpResponse::Ok().json(spec) }
            }))
    })
    .bind((host.as_str(), port))?
    .run()
    .await?;

    Ok(())
}
