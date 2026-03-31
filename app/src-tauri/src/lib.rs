use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct DockerStatus {
    pub installed: bool,
    pub running: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DockerInstallResult {
    pub success: bool,
    pub message: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Check if Docker is installed and running
#[tauri::command]
async fn check_docker() -> Result<DockerStatus, String> {
    // Check if Docker is installed
    let docker_check = Command::new("docker")
        .arg("--version")
        .output();

    match docker_check {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout).trim().to_string();

                // Check if Docker is running
                let running_check = Command::new("docker")
                    .arg("ps")
                    .output();

                match running_check {
                    Ok(running_output) => {
                        let is_running = running_output.status.success();
                        Ok(DockerStatus {
                            installed: true,
                            running: is_running,
                            version: Some(version),
                            error: None,
                        })
                    }
                    Err(e) => Ok(DockerStatus {
                        installed: true,
                        running: false,
                        version: Some(version),
                        error: Some(format!("Failed to check Docker status: {}", e)),
                    }),
                }
            } else {
                Ok(DockerStatus {
                    installed: false,
                    running: false,
                    version: None,
                    error: None,
                })
            }
        }
        Err(_) => Ok(DockerStatus {
            installed: false,
            running: false,
            version: None,
            error: Some("Docker is not installed".to_string()),
        }),
    }
}

/// Start Docker Desktop
#[tauri::command]
async fn start_docker() -> Result<DockerInstallResult, String> {
    // Try to start Docker Desktop
    #[cfg(target_os = "windows")]
    {
        let result = Command::new("cmd")
            .args(&["/C", "start", "", "Docker Desktop"])
            .spawn();

        match result {
            Ok(_) => Ok(DockerInstallResult {
                success: true,
                message: "Docker Desktop starting...".to_string(),
            }),
            Err(e) => {
                // Try alternative paths
                let paths = [
                    r"C:\Program Files\Docker\Docker\Docker Desktop.exe",
                    r"C:\Users\{USER}\AppData\Local\Docker\Docker Desktop\Docker Desktop.exe",
                ];

                for path in paths.iter() {
                    let expanded_path = path.replace("{USER}", &std::env::var("USERPROFILE").unwrap_or_default());
                    if std::path::Path::new(&expanded_path).exists() {
                        let result = Command::new(&expanded_path).spawn();
                        if result.is_ok() {
                            return Ok(DockerInstallResult {
                                success: true,
                                message: "Docker Desktop starting...".to_string(),
                            });
                        }
                    }
                }

                Ok(DockerInstallResult {
                    success: false,
                    message: format!("Failed to start Docker Desktop: {}", e),
                })
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    Ok(DockerInstallResult {
        success: false,
        message: "Docker auto-start is only supported on Windows".to_string(),
    })
}

/// Get Docker system info
#[tauri::command]
async fn get_docker_info() -> Result<String, String> {
    let output = Command::new("docker")
        .args(&["info", "--format", "{{json .}}"])
        .output();

    match output {
        Ok(out) => {
            if out.status.success() {
                Ok(String::from_utf8_lossy(&out.stdout).to_string())
            } else {
                Err("Docker is not running".to_string())
            }
        }
        Err(e) => Err(format!("Failed to get Docker info: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_docker,
            start_docker,
            get_docker_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
