use actix_web::{HttpResponse, ResponseError};
use std::fmt;

#[derive(Debug)]
pub enum OrbitError {
    AdbError(String),
    DeviceNotFound(String),
    Internal(String),
}

impl fmt::Display for OrbitError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::AdbError(msg) => write!(f, "ADB error: {}", msg),
            Self::DeviceNotFound(id) => write!(f, "Device not found: {}", id),
            Self::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl ResponseError for OrbitError {
    fn error_response(&self) -> HttpResponse {
        let (status, msg) = match self {
            Self::DeviceNotFound(_) => (actix_web::http::StatusCode::NOT_FOUND, self.to_string()),
            Self::AdbError(_) => (actix_web::http::StatusCode::BAD_GATEWAY, self.to_string()),
            Self::Internal(_) => {
                (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, self.to_string())
            }
        };
        HttpResponse::build(status).json(serde_json::json!({
            "success": false,
            "error": msg,
        }))
    }
}
